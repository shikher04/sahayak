"""
Pinecone indexing pipeline for Sahayak.

Reads schemes and rights from PostgreSQL, chunks each into 3 text
segments, embeds with multilingual-e5-large, and upserts to Pinecone.

Index config:
  name: sahayak-schemes
  dimension: 1024
  metric: cosine
  cloud: aws, region: us-east-1
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any

# Allow importing from apps/api
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "apps" / "api"))

from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, engine
from models import Right, Scheme

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "sahayak-schemes")
DIMENSION = 384
BATCH_SIZE = 50

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("Loading paraphrase-multilingual-MiniLM-L12-v2 model...")
        _model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        print("Model loaded.")
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    model = get_model()
    # e5-large expects "passage: ..." prefix for indexing
    vecs = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    return [v.tolist() for v in vecs]


def chunk_scheme(scheme: Scheme) -> list[dict[str, Any]]:
    """Split one scheme into 3 indexable chunks with metadata."""
    base_meta = {
        "scheme_id": str(scheme.id),
        "scheme_name": scheme.name,
        "category": scheme.category,
        "level": scheme.level,
        "state_code": scheme.state_code or "ALL",
        "benefit_amount": scheme.benefit_amount or "",
    }

    crit = scheme.eligibility_criteria
    docs = scheme.required_documents

    overview_text = (
        f"{scheme.name}. Ministry: {scheme.ministry}. "
        f"Category: {scheme.category}. Level: {scheme.level}. "
        f"{scheme.description}"
    )
    eligibility_text = (
        f"{scheme.name} — Eligibility Criteria: "
        f"{json.dumps(crit, ensure_ascii=False)}. "
        f"Benefit: {scheme.benefit_amount or 'See details'}."
    )
    application_text = (
        f"{scheme.name} — How to Apply: Visit {scheme.application_url or 'official portal'}. "
        f"Required Documents: {', '.join(str(d) for d in docs)}."
    )

    return [
        {
            "id": f"{scheme.id}-overview",
            "text": overview_text,
            "metadata": {**base_meta, "chunk_type": "overview", "text": overview_text},
        },
        {
            "id": f"{scheme.id}-eligibility",
            "text": eligibility_text,
            "metadata": {**base_meta, "chunk_type": "eligibility", "text": eligibility_text},
        },
        {
            "id": f"{scheme.id}-application",
            "text": application_text,
            "metadata": {**base_meta, "chunk_type": "application", "text": application_text},
        },
    ]


def chunk_right(right: Right) -> list[dict[str, Any]]:
    base_meta = {
        "right_id": str(right.id),
        "title": right.title,
        "category": right.category,
        "chunk_type": "rights",
    }

    articles_str = ", ".join(
        f"Article {a['number']}: {a['title']}" for a in right.articles
    )
    steps_str = " ".join(str(s) for s in right.action_steps)

    overview_text = f"{right.title}. {right.description}. {articles_str}"
    action_text = f"{right.title} — How to exercise this right: {steps_str}"

    return [
        {
            "id": f"right-{right.id}-overview",
            "text": overview_text,
            "metadata": {**base_meta, "scheme_name": right.title, "text": overview_text},
        },
        {
            "id": f"right-{right.id}-actions",
            "text": action_text,
            "metadata": {**base_meta, "chunk_type": "rights_action", "scheme_name": right.title, "text": action_text},
        },
    ]


def create_or_verify_index(pc: Pinecone) -> None:
    existing = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME not in existing:
        print(f"Creating index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print("Index created.")
    else:
        print(f"Index '{INDEX_NAME}' already exists.")


def upsert_batch(index, vectors: list[dict[str, Any]]) -> None:
    """Upsert vectors in batches of BATCH_SIZE."""
    for i in range(0, len(vectors), BATCH_SIZE):
        batch = vectors[i : i + BATCH_SIZE]
        pinecone_batch = [
            (v["id"], v["embedding"], v["metadata"]) for v in batch
        ]
        index.upsert(vectors=pinecone_batch)
        print(f"  Upserted {min(i + BATCH_SIZE, len(vectors))}/{len(vectors)}")


async def index_all() -> None:
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY environment variable not set")

    pc = Pinecone(api_key=api_key)
    create_or_verify_index(pc)
    index = pc.Index(INDEX_NAME)

    async with AsyncSessionLocal() as session:
        schemes = (await session.execute(select(Scheme).where(Scheme.is_active == True))).scalars().all()  # noqa: E712
        rights = (await session.execute(select(Right))).scalars().all()

    print(f"\nIndexing {len(schemes)} schemes...")
    scheme_chunks: list[dict[str, Any]] = []
    for scheme in schemes:
        scheme_chunks.extend(chunk_scheme(scheme))

    texts = [c["text"] for c in scheme_chunks]
    embeddings = embed(texts)
    for chunk, vec in zip(scheme_chunks, embeddings):
        chunk["embedding"] = vec

    upsert_batch(index, scheme_chunks)
    print(f"✓ Indexed {len(scheme_chunks)} scheme chunks from {len(schemes)} schemes")

    print(f"\nIndexing {len(rights)} rights...")
    right_chunks: list[dict[str, Any]] = []
    for right in rights:
        right_chunks.extend(chunk_right(right))

    texts = [c["text"] for c in right_chunks]
    embeddings = embed(texts)
    for chunk, vec in zip(right_chunks, embeddings):
        chunk["embedding"] = vec

    upsert_batch(index, right_chunks)
    print(f"✓ Indexed {len(right_chunks)} rights chunks from {len(rights)} rights")

    await engine.dispose()
    print("\n✓ Pinecone indexing complete!")


async def index_single_scheme(scheme_id: str) -> bool:
    """Re-index a single scheme (called by Celery task on update)."""
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        return False

    pc = Pinecone(api_key=api_key)
    index = pc.Index(INDEX_NAME)

    import uuid
    async with AsyncSessionLocal() as session:
        scheme = (
            await session.execute(select(Scheme).where(Scheme.id == uuid.UUID(scheme_id)))
        ).scalar_one_or_none()

    if not scheme:
        return False

    chunks = chunk_scheme(scheme)
    texts = [c["text"] for c in chunks]
    embeddings = embed(texts)

    vectors = [(c["id"], emb, c["metadata"]) for c, emb in zip(chunks, embeddings)]
    index.upsert(vectors=vectors)
    return True


if __name__ == "__main__":
    asyncio.run(index_all())
