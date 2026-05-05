"""
Scheme data scraper for Sahayak.
Fetches scheme metadata from official government portals.
Currently implemented: myscheme.gov.in public API.
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

import httpx

OUTPUT_FILE = Path(__file__).parent / "scraped_schemes.json"

MYSCHEME_API = "https://api.myscheme.gov.in/search/v4/schemes"
HEADERS = {
    "User-Agent": "Sahayak/1.0 (research; contact@example.com)",
    "Accept": "application/json",
}


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


async def scrape_all(max_pages: int = 5) -> list[dict]:
    """Scrape up to max_pages * 50 schemes from myscheme.gov.in."""
    all_schemes: list[dict] = []

    async with httpx.AsyncClient(follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            print(f"Fetching page {page}...")
            try:
                data = await fetch_schemes_page(client, page)
                schemes = data.get("data", {}).get("schemes", [])
                if not schemes:
                    break
                all_schemes.extend(schemes)
                print(f"  Got {len(schemes)} schemes (total: {len(all_schemes)})")
                await asyncio.sleep(1)  # polite crawl delay
            except httpx.HTTPError as e:
                print(f"  HTTP error on page {page}: {e}")
                break

    return all_schemes


def normalize_scheme(raw: dict) -> dict:
    """Convert myscheme.gov.in format to Sahayak schema."""
    return {
        "name": raw.get("title", ""),
        "ministry": raw.get("nodalMinistryName", ""),
        "category": (raw.get("tags", ["welfare"]) or ["welfare"])[0].lower().replace(" ", "_"),
        "level": "state" if raw.get("state") else "central",
        "state_code": raw.get("stateCode"),
        "description": raw.get("briefDescription", ""),
        "benefit_amount": raw.get("benefitAmount", ""),
        "eligibility_criteria": raw.get("beneficiaryType", {}),
        "required_documents": raw.get("documents", []),
        "application_url": raw.get("applicationLink", ""),
    }


async def main() -> None:
    print("Scraping schemes from myscheme.gov.in...")
    raw = await scrape_all(max_pages=3)
    normalized = [normalize_scheme(s) for s in raw]
    OUTPUT_FILE.write_text(json.dumps(normalized, indent=2, ensure_ascii=False))
    print(f"\n✓ Scraped {len(normalized)} schemes → {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
