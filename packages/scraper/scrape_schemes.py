"""
Scheme data scraper for Sahayak.
Fetches scheme metadata from official government portals.
Currently implemented: myscheme.gov.in public API.

Usage:
  python scrape_schemes.py                  # scrape 20 pages (~1000 schemes)
  python scrape_schemes.py --pages 50       # scrape more
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import httpx

OUTPUT_FILE = Path(__file__).parent / "scraped_schemes.json"

MYSCHEME_API = "https://api.myscheme.gov.in/search/v4/schemes"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Sahayak/1.0; +https://sahayak.gov)",
    "Accept": "application/json",
    "Accept-Language": "en-IN,en;q=0.9",
}

CATEGORY_MAP: dict[str, str] = {
    "agriculture": "agriculture",
    "farmer": "agriculture",
    "farming": "agriculture",
    "health": "health",
    "medical": "health",
    "healthcare": "health",
    "housing": "housing",
    "home": "housing",
    "shelter": "housing",
    "education": "education",
    "scholarship": "education",
    "school": "education",
    "employment": "employment",
    "job": "employment",
    "skill": "employment",
    "women": "welfare",
    "child": "welfare",
    "welfare": "welfare",
    "social": "welfare",
    "pension": "pension",
    "retirement": "pension",
    "insurance": "insurance",
    "loan": "loan",
    "credit": "loan",
    "finance": "loan",
    "savings": "savings",
    "deposit": "savings",
}


def _map_category(tags: list[str] | None) -> str:
    """Best-effort category mapping from myscheme tags."""
    if not tags:
        return "welfare"
    for tag in tags:
        tag_lower = tag.lower().strip()
        for keyword, category in CATEGORY_MAP.items():
            if keyword in tag_lower:
                return category
    # Default: use first tag cleaned up
    first = (tags[0] or "welfare").lower().replace(" ", "_")
    return first[:20]


async def fetch_schemes_page(client: httpx.AsyncClient, page: int, limit: int = 50) -> dict:
    params = {
        "keyword": "",
        "lang": "en",
        "schemeType": "",
        "state": "",
        "beneficiarytype": "",
        "category": "",
        "subcat": "",
        "gender": "",
        "age": "",
        "caste": "",
        "minority": "",
        "differently_abled": "",
        "bpl": "",
        "occupation": "",
        "pageNumber": page,
        "numberOfResults": limit,
    }
    response = await client.get(MYSCHEME_API, params=params, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()


async def scrape_all(max_pages: int = 20) -> list[dict]:
    """Scrape up to max_pages * 50 schemes from myscheme.gov.in."""
    all_schemes: list[dict] = []

    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        for page in range(1, max_pages + 1):
            print(f"  Fetching page {page}/{max_pages}...", end=" ", flush=True)
            try:
                data = await fetch_schemes_page(client, page)
                schemes = data.get("data", {}).get("schemes", [])
                if not schemes:
                    print("no more data, stopping.")
                    break
                all_schemes.extend(schemes)
                print(f"got {len(schemes)} (total: {len(all_schemes)})")
                await asyncio.sleep(0.8)  # polite crawl delay
            except httpx.HTTPStatusError as e:
                print(f"HTTP {e.response.status_code}, stopping.")
                break
            except httpx.HTTPError as e:
                print(f"error: {e}, stopping.")
                break

    return all_schemes


def normalize_scheme(raw: dict) -> dict:
    """Convert myscheme.gov.in format to Sahayak schema."""
    tags = raw.get("tags") or raw.get("schemeTags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    documents = raw.get("documents") or raw.get("requiredDocuments") or []
    if isinstance(documents, str):
        documents = [d.strip() for d in documents.split(",") if d.strip()]

    return {
        "name": (raw.get("schemeName") or raw.get("title") or "").strip(),
        "ministry": (raw.get("nodalMinistryName") or raw.get("ministry") or "").strip(),
        "category": _map_category(tags),
        "level": "state" if raw.get("state") or raw.get("stateCode") else "central",
        "state_code": raw.get("stateCode") or raw.get("state"),
        "description": (
            raw.get("briefDescription") or raw.get("schemeShortTitle") or ""
        ).strip(),
        "benefit_amount": raw.get("benefitAmount") or raw.get("benefit") or "",
        "eligibility_criteria": raw.get("beneficiaryType") or raw.get("eligibility") or {},
        "required_documents": documents,
        "application_url": (
            raw.get("applicationLink") or raw.get("applicationUrl") or ""
        ).strip(),
    }


async def main(max_pages: int) -> None:
    print(f"Scraping up to {max_pages * 50} schemes from myscheme.gov.in...")
    raw = await scrape_all(max_pages=max_pages)
    if not raw:
        print("No schemes scraped. The API may have changed or rate-limited this request.")
        return

    normalized = [normalize_scheme(s) for s in raw]
    # Deduplicate by name
    seen: set[str] = set()
    unique = []
    for s in normalized:
        key = s["name"].lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(s)

    OUTPUT_FILE.write_text(json.dumps(unique, indent=2, ensure_ascii=False))
    print(f"\n✓ Scraped {len(unique)} unique schemes → {OUTPUT_FILE}")
    print(f"  Next step: run 'python import_to_db.py' to load into the database")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pages", type=int, default=20, help="Number of pages to fetch (50 schemes/page)")
    args = parser.parse_args()
    asyncio.run(main(args.pages))
