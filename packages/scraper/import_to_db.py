"""
Import scraped schemes from scraped_schemes.json into the PostgreSQL database.

Run after scrape_schemes.py:
  python import_to_db.py

Requires DATABASE_URL in env (same as the API).
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import uuid
from pathlib import Path

# Allow running from the scraper directory
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "apps" / "api"))

SCRAPED_FILE = Path(__file__).parent / "scraped_schemes.json"


async def main() -> None:
    if not SCRAPED_FILE.exists():
        print("ERROR: scraped_schemes.json not found. Run scrape_schemes.py first.")
        sys.exit(1)

    schemes = json.loads(SCRAPED_FILE.read_text())
    print(f"Loaded {len(schemes)} schemes from {SCRAPED_FILE}")

    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)

    # Normalise Railway postgres:// → postgresql+asyncpg://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select, text

    engine = create_async_engine(database_url, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Make sure table exists (run alembic separately in production)
        try:
            await db.execute(text("SELECT 1 FROM schemes LIMIT 1"))
        except Exception:
            print("ERROR: 'schemes' table not found. Run 'alembic upgrade head' first.")
            await engine.dispose()
            sys.exit(1)

        inserted = 0
        skipped = 0

        for s in schemes:
            name = (s.get("name") or "").strip()
            if not name:
                skipped += 1
                continue

            # Skip if already exists (upsert by name)
            from sqlalchemy import text as t_
            existing = (await db.execute(
                t_(f"SELECT id FROM schemes WHERE LOWER(name) = LOWER(:name) LIMIT 1"),
                {"name": name},
            )).fetchone()

            if existing:
                skipped += 1
                continue

            row = {
                "id": str(uuid.uuid4()),
                "name": name[:200],
                "ministry": (s.get("ministry") or "")[:150],
                "category": (s.get("category") or "welfare")[:50],
                "level": s.get("level", "central"),
                "state_code": (s.get("state_code") or None),
                "description": s.get("description") or "",
                "benefit_amount": (s.get("benefit_amount") or None),
                "eligibility_criteria": json.dumps(s.get("eligibility_criteria") or {}),
                "required_documents": json.dumps(s.get("required_documents") or []),
                "application_url": (s.get("application_url") or None),
                "is_active": True,
            }

            await db.execute(
                t_("""
                    INSERT INTO schemes
                      (id, name, ministry, category, level, state_code, description,
                       benefit_amount, eligibility_criteria, required_documents,
                       application_url, is_active)
                    VALUES
                      (:id, :name, :ministry, :category, :level, :state_code, :description,
                       :benefit_amount, :eligibility_criteria::jsonb, :required_documents::jsonb,
                       :application_url, :is_active)
                """),
                row,
            )
            inserted += 1

            if inserted % 50 == 0:
                await db.commit()
                print(f"  Inserted {inserted} so far...")

        await db.commit()

    await engine.dispose()
    print(f"\n✓ Done. Inserted: {inserted}, Skipped (already exists or empty): {skipped}")
    if inserted > 0:
        print("  Next step: re-run the Pinecone indexer to embed new schemes:")
        print("    cd packages/embeddings && python index_schemes.py")


if __name__ == "__main__":
    asyncio.run(main())
