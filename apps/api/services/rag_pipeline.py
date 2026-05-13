"""
8-step RAG pipeline supporting Groq (cloud) and Ollama (local):
1. Receive query (any Indian language)
2. Detect language with langdetect
3. Translate to English if needed
4. Embed with multilingual-e5-large (1024-dim)
5. Query Pinecone (top-8), filter by profile metadata
6. Rerank with Cohere if available, else use top-3 raw results
7. Build prompt with retrieved context + user profile
8. Stream response token-by-token via SSE

Set LLM_PROVIDER=groq (production) or LLM_PROVIDER=ollama (local dev).
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

import cohere
import httpx
from groq import AsyncGroq
from langdetect import LangDetectException, detect
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

from config import settings

logger = logging.getLogger(__name__)

_embedding_model: SentenceTransformer | None = None
_pinecone_index = None
_cohere_client: cohere.AsyncClient | None = None
_groq_client: AsyncGroq | None = None


def _get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    return _embedding_model


def _get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None and settings.pinecone_api_key:
        pc = Pinecone(api_key=settings.pinecone_api_key)
        _pinecone_index = pc.Index(settings.pinecone_index_name)
    return _pinecone_index


def _get_cohere() -> cohere.AsyncClient | None:
    global _cohere_client
    if _cohere_client is None and settings.cohere_api_key:
        _cohere_client = cohere.AsyncClient(settings.cohere_api_key)
    return _cohere_client


def _get_groq() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.groq_api_key)
    return _groq_client


LANGUAGE_NAMES: dict[str, str] = {
    "en": "English", "hi": "Hindi", "ta": "Tamil", "te": "Telugu",
    "mr": "Marathi", "bn": "Bengali", "gu": "Gujarati", "kn": "Kannada",
    "ml": "Malayalam", "pa": "Punjabi",
}

RAG_SYSTEM_PROMPT = (
    "You are Sahayak, a trusted AI assistant for Indian citizens seeking information about "
    "government welfare schemes and legal rights. Your role is to help ordinary people "
    "understand what benefits they are entitled to and how to access them.\n\n"
    "Rules:\n"
    "- Answer ONLY using the provided CONTEXT. Never invent scheme details.\n"
    "- If the answer is not clearly in the context, say so honestly and suggest the user "
    "visit the official portal or contact the relevant ministry.\n"
    "- Always cite the specific scheme name, ministry, or article number for every claim.\n"
    "- Use simple, friendly language. Avoid jargon. Structure answers with numbered steps "
    "when explaining how to apply.\n"
    "- If a user profile is provided, tailor the response to their state, income, occupation, "
    "and category (SC/ST/OBC/EWS/General).\n"
    "- When the user asks in a regional language, respond in that language.\n"
    "- Always mention the application URL when available."
)

RAG_PROMPT_TEMPLATE = """\
CONTEXT:
{retrieved_chunks}

USER PROFILE (if available):
{profile_json}

USER QUESTION: {query}

Please respond in {language}. Cite specific scheme names or article numbers for every claim.
"""


async def _detect_language(text: str) -> str:
    try:
        return detect(text)
    except LangDetectException:
        return "en"


async def _translate_to_english(text: str, source_lang: str) -> str:
    prompt = (
        f"Translate the following {LANGUAGE_NAMES.get(source_lang, source_lang)} text to English. "
        f"Return only the translation, no explanation.\n\n{text}"
    )
    if settings.llm_provider == "groq":
        client = _get_groq()
        resp = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256,
        )
        return resp.choices[0].message.content.strip()
    else:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", text).strip()


def _embed(text: str) -> list[float]:
    model = _get_embedding_model()
    return model.encode(text, normalize_embeddings=True).tolist()


async def _query_pinecone(
    vector: list[float],
    top_k: int,
    filter_metadata: dict[str, Any] | None = None,
) -> list[dict]:
    index = _get_pinecone_index()
    if index is None:
        return []
    kwargs: dict[str, Any] = {"vector": vector, "top_k": top_k, "include_metadata": True}
    if filter_metadata:
        kwargs["filter"] = filter_metadata
    result = index.query(**kwargs)
    return [
        {
            "id": match["id"],
            "score": match["score"],
            "metadata": match.get("metadata", {}),
            "text": match.get("metadata", {}).get("text", ""),
        }
        for match in result.get("matches", [])
    ]


async def _rerank(query: str, documents: list[dict], top_n: int) -> list[dict]:
    cohere_client = _get_cohere()
    if cohere_client is None or not documents:
        return documents[:top_n]
    texts = [d.get("text", "") for d in documents]
    response = await cohere_client.rerank(
        model=settings.cohere_rerank_model,
        query=query,
        documents=texts,
        top_n=top_n,
    )
    reranked = []
    for result in response.results:
        doc = documents[result.index]
        doc["rerank_score"] = result.relevance_score
        reranked.append(doc)
    return reranked


def _build_context(documents: list[dict]) -> str:
    chunks = []
    for i, doc in enumerate(documents, 1):
        meta = doc.get("metadata", {})
        name = meta.get("scheme_name", meta.get("title", f"Document {i}"))
        text = doc.get("text", "")
        chunks.append(f"[{i}] {name}\n{text}")
    return "\n\n".join(chunks)


async def _stream_groq(prompt: str, history: list[dict] | None = None) -> AsyncIterator[str]:
    client = _get_groq()
    messages: list[dict] = [{"role": "system", "content": RAG_SYSTEM_PROMPT}]
    if history:
        # Include last 6 messages (3 exchanges) for context, excluding the current query
        for msg in history[-6:]:
            if msg.get("role") in ("user", "assistant") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": prompt})

    stream = await client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        max_tokens=settings.llm_max_tokens,
        stream=True,
    )
    async for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield token


async def _stream_ollama(prompt: str, history: list[dict] | None = None) -> AsyncIterator[str]:
    history_text = ""
    if history:
        for msg in history[-6:]:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                history_text += f"User: {content}\n"
            elif role == "assistant":
                history_text += f"Assistant: {content}\n"

    full_prompt = f"SYSTEM: {RAG_SYSTEM_PROMPT}\n\n"
    if history_text:
        full_prompt += f"CONVERSATION HISTORY:\n{history_text}\n"
    full_prompt += prompt

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": full_prompt,
                "stream": True,
                "options": {"num_predict": settings.llm_max_tokens},
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get("response", "")
                    if token:
                        yield token
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue


async def run_rag_pipeline(
    query: str,
    language: str = "en",
    profile: dict[str, Any] | None = None,
    history: list[dict] | None = None,
) -> AsyncIterator[str]:
    """Full RAG pipeline. Yields SSE-formatted text chunks."""

    detected_lang = await _detect_language(query)
    response_language = LANGUAGE_NAMES.get(language, language)

    english_query = query
    if detected_lang != "en":
        try:
            english_query = await _translate_to_english(query, detected_lang)
        except Exception as e:
            logger.warning("Translation failed, using original: %s", e)

    try:
        vector = _embed(english_query)
    except Exception as e:
        logger.error("Embedding failed: %s", e)
        yield "data: [ERROR] Embedding service unavailable\n\n"
        return

    pinecone_filter: dict[str, Any] | None = None
    if profile:
        filters: dict[str, Any] = {}
        if profile.get("state"):
            filters["state_code"] = {"$in": [profile["state"], "ALL"]}
        if filters:
            pinecone_filter = filters

    try:
        raw_docs = await _query_pinecone(vector, settings.pinecone_top_k, pinecone_filter)
    except Exception as e:
        logger.error("Pinecone query failed: %s", e)
        raw_docs = []

    try:
        docs = await _rerank(english_query, raw_docs, settings.cohere_rerank_top_n) if raw_docs else []
    except Exception as e:
        logger.warning("Reranking failed: %s", e)
        docs = raw_docs[:settings.cohere_rerank_top_n]

    context = _build_context(docs) if docs else "No relevant documents found in the database."
    profile_json = json.dumps(profile, indent=2, ensure_ascii=False) if profile else "Not provided"

    prompt = RAG_PROMPT_TEMPLATE.format(
        retrieved_chunks=context,
        profile_json=profile_json,
        query=query,
        language=response_language,
    )

    sources = [
        {
            "title": d.get("metadata", {}).get("scheme_name", d.get("metadata", {}).get("title", "Unknown")),
            "chunk_type": d.get("metadata", {}).get("chunk_type", ""),
            "score": d.get("rerank_score", d.get("score", 0)),
        }
        for d in docs
    ]

    try:
        if settings.llm_provider == "groq":
            stream = _stream_groq(prompt, history)
        else:
            stream = _stream_ollama(prompt, history)

        async for token in stream:
            escaped = token.replace("\n", "\\n")
            yield f"data: {escaped}\n\n"

        metadata = json.dumps({"sources": sources, "docs_retrieved": len(docs)}, ensure_ascii=False)
        yield f"data: [DONE]{metadata}\n\n"

    except httpx.ConnectError:
        yield "data: [ERROR] Ollama is not running. Please run: ollama serve\n\n"
    except Exception as e:
        logger.error("LLM error: %s", e)
        yield "data: [ERROR] AI service temporarily unavailable. Please try again.\n\n"
