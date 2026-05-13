# Scraper Package — Adding Government Schemes

Three ways to add schemes to Sahayak:

## Option 1: Manual Addition (Recommended for now)

Edit `schemes_template.json` with scheme data in the format shown. Then import:

```bash
cd apps/api
DATABASE_URL="$DATABASE_URL" python ../../packages/scraper/import_to_db.py
```

**Schema fields:**
- `name` (string, required) — Official scheme name
- `ministry` (string, required) — Nodal ministry
- `category` (string) — agriculture, health, housing, education, employment, savings, loan, insurance, welfare, pension
- `level` (string) — "central" or "state"
- `state_code` (string or null) — State code if applicable (e.g., "MH" for Maharashtra)
- `description` (string) — 1-2 sentence summary
- `benefit_amount` (string) — e.g., "₹6,000/year" or "₹5 lakh health cover"
- `eligibility_criteria` (object) — Key-value pairs of eligibility rules
- `required_documents` (array) — List of documents needed
- `application_url` (string) — Link to apply (e.g., pmkisan.gov.in)

**Example:**
```json
{
  "name": "PM Kisan Samman Nidhi",
  "ministry": "Ministry of Agriculture & Farmers Welfare",
  "category": "agriculture",
  "level": "central",
  "state_code": null,
  "description": "Direct income support of ₹6,000 per year to farmers",
  "benefit_amount": "₹6,000/year",
  "eligibility_criteria": {"land_ownership": "required"},
  "required_documents": ["Aadhaar", "Land records"],
  "application_url": "https://pmkisan.gov.in"
}
```

## Option 2: Web Scraping (When stable)

```bash
# Install deps
pip install beautifulsoup4 lxml

# Scrape myscheme.gov.in
python scrape_myscheme_web.py --pages 30

# Import into PostgreSQL
DATABASE_URL="$DATABASE_URL" python import_to_db.py
```

## Option 3: API Scraping (Legacy, Currently Blocked)

```bash
pip install httpx

# Scrape myscheme.gov.in API
python scrape_schemes.py --pages 30

# Import into PostgreSQL
DATABASE_URL="$DATABASE_URL" python import_to_db.py
```

---

## After Importing Schemes

**Step 3: Re-embed to Pinecone** (required for RAG search to work)

```bash
cd packages/embeddings
python index_schemes.py
```

This chunks + embeds new schemes into the Pinecone vector DB so the RAG pipeline can find them.

---

## Current Data

- **15 seed schemes** hardcoded in `apps/api/scripts/seed.py`
- **Available to add**: Hundreds of real schemes from government portals

To expand to 100+ schemes, manually add entries to `schemes_template.json` from sources like:
- [myscheme.gov.in](https://myscheme.gov.in) — UI browsing
- [pib.gov.in](https://pib.gov.in) — Scheme announcements
- [dbt.gov.in](https://dbt.gov.in) — DBT portal
- Individual ministry websites (PMO, Labour, Rural Development, etc.)
