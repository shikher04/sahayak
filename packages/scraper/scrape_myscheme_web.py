"""
Web scraper for myscheme.gov.in — more reliable than the API.
Fetches scheme data from the public website using BeautifulSoup.

Usage:
  pip install beautifulsoup4 lxml
  python scrape_myscheme_web.py --pages 50
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
from pathlib import Path
from typing import Any

import httpx
from bs4 import BeautifulSoup

OUTPUT_FILE = Path(__file__).parent / "scraped_schemes.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Referer": "https://www.myscheme.gov.in/",
}

CATEGORY_MAP = {
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
    "college": "education",
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


def _map_category(text: str | None) -> str:
    """Map scheme text to category."""
    if not text:
        return "welfare"
    text_lower = text.lower()
    for keyword, category in CATEGORY_MAP.items():
        if keyword in text_lower:
            return category
    return "welfare"


def _clean_text(text: str | None) -> str:
    """Clean and normalize text."""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)  # collapse whitespace
    return text


def _extract_benefit(text: str | None) -> str:
    """Extract benefit amount from text."""
    if not text:
        return ""
    # Try to find currency amounts
    match = re.search(r'(₹|Rs\.?)\s*[\d,]+(?:\s*(?:lakh|crore|lacs?))?', text)
    if match:
        return _clean_text(match.group(0))
    # Otherwise return full text if it looks like a benefit
    cleaned = _clean_text(text)
    if len(cleaned) < 200:
        return cleaned
    return ""


async def fetch_page(client: httpx.AsyncClient, url: str) -> str | None:
    """Fetch a page with retries."""
    try:
        resp = await client.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    except httpx.HTTPError as e:
        print(f"  Error fetching {url}: {e}")
        return None


async def scrape_scheme_list(
    client: httpx.AsyncClient, page: int = 1
) -> tuple[list[dict[str, Any]], bool]:
    """
    Scrape a page of scheme listings from myscheme.gov.in.
    Returns (schemes, has_next_page).
    """
    url = f"https://www.myscheme.gov.in/search/scheme?page={page}"
    html = await fetch_page(client, url)
    if not html:
        return [], False

    soup = BeautifulSoup(html, "lxml")
    schemes: list[dict[str, Any]] = []

    # Look for scheme cards (adjust selectors based on actual HTML)
    scheme_cards = soup.find_all("div", {"class": re.compile(r"scheme|card|item", re.I)})

    for card in scheme_cards:
        try:
            # Extract scheme name
            name_elem = card.find(["h2", "h3", "h4", "a"], {"class": re.compile(r"name|title", re.I)})
            if not name_elem:
                name_elem = card.find("a")
            name = _clean_text(name_elem.get_text() if name_elem else None)
            if not name or len(name) < 3:
                continue

            # Extract ministry
            ministry_elem = card.find(["p", "span"], {"class": re.compile(r"ministry|department", re.I)})
            ministry = _clean_text(ministry_elem.get_text() if ministry_elem else None)

            # Extract description
            desc_elem = card.find(["p", "div"], {"class": re.compile(r"description|details|brief", re.I)})
            description = _clean_text(desc_elem.get_text() if desc_elem else None)

            # Extract benefit amount
            benefit_elem = card.find(re.compile(r"span|p"), {"class": re.compile(r"benefit|amount", re.I)})
            benefit_text = benefit_elem.get_text() if benefit_elem else ""
            benefit = _extract_benefit(benefit_text)

            # Extract application URL
            app_url = ""
            app_link = card.find("a", {"class": re.compile(r"apply|visit|link", re.I)})
            if app_link and app_link.get("href"):
                app_url = app_link["href"]
                if not app_url.startswith(("http://", "https://")):
                    app_url = f"https://www.myscheme.gov.in{app_url}"

            # Determine level and state
            level = "central"
            state_code = None
            if "state" in description.lower() or "state" in ministry.lower():
                level = "state"

            schemes.append(
                {
                    "name": name,
                    "ministry": ministry or "Ministry of Unknown",
                    "category": _map_category(description or name),
                    "level": level,
                    "state_code": state_code,
                    "description": description or "",
                    "benefit_amount": benefit,
                    "eligibility_criteria": {},
                    "required_documents": [],
                    "application_url": app_url,
                }
            )
        except Exception as e:
            # Skip cards that fail to parse
            continue

    # Check for next page
    has_next = bool(soup.find("a", {"class": re.compile(r"next|pagination", re.I)}))

    return schemes, has_next


async def scrape_all(max_pages: int = 50) -> list[dict[str, Any]]:
    """Scrape all scheme listings."""
    all_schemes: list[dict[str, Any]] = []

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        for page in range(1, max_pages + 1):
            print(f"  Page {page}/{max_pages}...", end=" ", flush=True)
            schemes, has_next = await scrape_scheme_list(client, page)

            if schemes:
                all_schemes.extend(schemes)
                print(f"got {len(schemes)} (total: {len(all_schemes)})")
            else:
                print("no schemes found, stopping.")
                break

            if not has_next:
                print("no next page, stopping.")
                break

            await asyncio.sleep(1.5)  # be respectful

    return all_schemes


async def main(max_pages: int) -> None:
    print(f"Web scraping myscheme.gov.in ({max_pages} pages max)...\n")
    schemes = await scrape_all(max_pages=max_pages)

    if not schemes:
        print("\nERROR: No schemes scraped. The website structure may have changed.")
        print("Fallback: using hardcoded schemes from seed.py")
        return

    # Deduplicate by name
    seen: set[str] = set()
    unique = []
    for s in schemes:
        key = s["name"].lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(s)

    OUTPUT_FILE.write_text(json.dumps(unique, indent=2, ensure_ascii=False))
    print(f"\n✓ Scraped {len(unique)} unique schemes → {OUTPUT_FILE}")
    print("Next step: run 'DATABASE_URL=... python import_to_db.py' to load into the database")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Web scraper for myscheme.gov.in")
    parser.add_argument(
        "--pages",
        type=int,
        default=50,
        help="Max pages to scrape (varies by page size)",
    )
    args = parser.parse_args()
    asyncio.run(main(args.pages))
