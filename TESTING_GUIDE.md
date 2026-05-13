# Testing Guide: feat/scheme-scraper Branch

This guide walks you through testing all the recent changes made in the `feat/scheme-scraper` branch, including:
- ✅ RAG pipeline crash fix
- ✅ Chat history support
- ✅ UI improvements (SchemeCard layout, home page, mobile nav, skeletons)
- ✅ Scheme expansion from 15 to 61+ government schemes

---

## Prerequisites

- Docker & Docker Compose installed
- `.env` file configured with `DATABASE_URL`
- Terminal access to the project directory

---

## Part 1: Start Local Development Environment

### Step 1.1: Ensure You're on the Correct Branch

```bash
cd /Users/shikher/projects/sahayak/.claude/worktrees/youthful-jemison-90e6c1
git branch -v
```

Expected output: Should show `feat/scheme-scraper` as the current branch

### Step 1.2: Run the Startup Script

This script will restart all Docker services, run migrations, and seed the database with initial schemes:

```bash
chmod +x restart.sh
./restart.sh
```

**What this does:**
- Stops and removes old Docker containers
- Rebuilds Docker images with latest code
- Waits for PostgreSQL to be ready
- Waits for API to be healthy
- Runs Alembic migrations (creates/updates database schema)
- Seeds database with 15 hardcoded schemes (if empty)
- Starts tailing API and web logs

**Expected output:**
```
✅ PostgreSQL ready
✅ API ready
✅ Migrations done
✅ Seed done
✅ Sahayak is running!
   Frontend → http://localhost:3000
   API docs → http://localhost:8000/api/docs
Tailing logs (Ctrl+C to stop watching, services keep running)...
```

⏱️ **First run takes ~2-3 minutes** while Docker builds images.

---

## Part 2: Import 46 New Government Schemes

### Step 2.1: Open a New Terminal (Keep the First One Running)

The `restart.sh` logs should still be running in the first terminal. Open a **new terminal window/tab**.

### Step 2.2: Import Schemes

```bash
cd /Users/shikher/projects/sahayak/.claude/worktrees/youthful-jemison-90e6c1
docker compose exec api python packages/scraper/import_to_db.py
```

**What this does:**
- Reads `packages/scraper/scraped_schemes.json` (contains 46 government schemes)
- Inserts them into PostgreSQL `schemes` table
- Skips duplicates (scheme names must be unique)
- Prints progress every 50 schemes

**Expected output:**
```
Loaded 46 schemes from .../scraped_schemes.json
  Inserted 46 so far...
✓ Done. Inserted: 46, Skipped (already exists or empty): 0
  Next step: re-run the Pinecone indexer to embed new schemes:
    cd packages/embeddings && python index_schemes.py
```

**Total schemes now in database: 15 (seed) + 46 (imported) = 61 schemes**

### Step 2.3: Re-Index Pinecone (For RAG Search)

```bash
docker compose exec api python packages/embeddings/index_schemes.py
```

**What this does:**
- Reads all schemes from the database
- Chunks each scheme into embeddings-friendly text
- Embeds each chunk using the multilingual-e5 model
- Upserts vectors to Pinecone index
- Makes schemes searchable via RAG pipeline (chat queries)

**Expected output:**
```
Loading all schemes from database...
Processing schemes...
Upserting to Pinecone...
✓ Indexed N schemes
```

---

## Part 3: Test All Features in the UI

### Test 3.1: View Schemes Page (UI Improvement Test)

1. Open http://localhost:3000/schemes in your browser
2. **Verify:**
   - ✅ You see **61+ scheme cards** (not just 15)
   - ✅ Each card shows:
     - Category icon and badge (green for agriculture, red for health, etc.)
     - Benefit amount prominently displayed below the header
     - Ministry name with building icon
     - 1-2 line description
     - Required documents list (expandable)
     - "Ask AI" and "Apply Now" buttons at the bottom
   - ✅ No text overlap on cards (scheme name doesn't overlap with badges)
   - ✅ Skeleton loaders appear while loading (gray shimmer effect)
   - ✅ Search bar at top with debounce (type and pause 400ms to see results)
   - ✅ Filter chips display (click category badges to filter)
   - ✅ Mobile navigation visible on small screens (bottom nav bar)

**Test Categories:**
- Click "Agriculture" filter → should show PM Kisan, Krishi Sinchayee, etc.
- Click "Health" filter → should show Ayushman Bharat, Mission Indradhanush, etc.
- Click "Housing" filter → should show PM Awas (Urban & Gramin)

### Test 3.2: Home Page (New Design Test)

1. Open http://localhost:3000 (root path)
2. **Verify:**
   - ✅ Hero section with gradient background
   - ✅ "Search schemes" input that links to chat (not a real search)
   - ✅ Category grid with icons showing all 10 categories:
     - Agriculture (Sprout icon)
     - Health (Heart icon)
     - Housing (Home icon)
     - Education (Graduation cap)
     - Employment (Briefcase)
     - Savings (Piggy bank)
     - Loan (Credit card)
     - Insurance (Shield)
     - Welfare (Users)
     - Pension (Landmark)
   - ✅ "How to Apply" CTA banner with steps
   - ✅ Trust pillars section showing: Official Data, 10 Languages, AI-Powered, Mobile First

### Test 3.3: Chat with History (New Feature Test)

1. Open http://localhost:3000/chat
2. **Test Chat History:**
   - Type: "What is PM Kisan?"
   - Wait for response
   - Type: "How much does it give?"
   - ✅ Verify the AI references PM Kisan from the previous message (not asking what scheme you're asking about)
   - Type: "Who is eligible?"
   - ✅ Verify the AI still knows you're asking about PM Kisan

3. **Test New UI Features in Chat:**
   - ✅ Each message has a timestamp
   - ✅ Copy button appears on AI responses (hover over response)
   - ✅ Sources/relevance shown at bottom of responses
   - ✅ "Thinking..." animation with bouncing dots while generating response

### Test 3.4: Mobile Navigation (New Component Test)

1. Open http://localhost:3000 on mobile or use browser dev tools (Ctrl+Shift+M or Cmd+Shift+M)
2. Resize to mobile width (~375px)
3. **Verify:**
   - ✅ Bottom navigation bar appears (fixed at bottom)
   - ✅ Has 5 tabs: Home, Schemes, Eligibility, Chat, Rights
   - ✅ Active tab shows colored top border
   - ✅ Nav bar doesn't overlap content
   - ✅ Click each tab → navigates correctly
   - ✅ Tap to show/hide bottom nav

### Test 3.5: RAG Pipeline & Multilingual Support

1. Open http://localhost:3000/chat
2. **Test different languages:**
   - Type in Hindi: "प्रधानमंत्री किसान योजना क्या है?"
   - ✅ Should get response in Hindi about PM Kisan
   - Type in Tamil: "வேளாண் திட்டங்கள் என்ன?"
   - ✅ Should get response in Tamil about agricultural schemes
   - Type in English: "What are housing schemes available?"
   - ✅ Should list PM Awas and other housing schemes

3. **Verify RAG retrieval (check sources at bottom):**
   - ✅ Each response shows sources with scheme names
   - ✅ Relevance scores displayed
   - ✅ Multiple documents retrieved (should be 3-8 sources)

---

## Part 4: Verify Database State

### Check Total Scheme Count

```bash
docker compose exec postgres psql -U sahayak -d sahayak -c "SELECT COUNT(*) as total_schemes FROM schemes;"
```

**Expected output:**
```
 total_schemes
 ---------------
 61
```

### List All Categories

```bash
docker compose exec postgres psql -U sahayak -d sahayak -c "SELECT DISTINCT category, COUNT(*) FROM schemes GROUP BY category ORDER BY COUNT(*) DESC;"
```

**Expected output:**
```
   category   | count
 ---------------+-------
 welfare       |   8
 agriculture   |   8
 education     |   7
 loan          |   6
 health        |   6
 savings       |   5
 pension       |   4
 employment    |   4
 insurance     |   3
 housing       |   2
```

### Check a Specific Scheme

```bash
docker compose exec postgres psql -U sahayak -d sahayak -c "SELECT name, ministry, benefit_amount FROM schemes WHERE name LIKE '%Kisan%';"
```

---

## Part 5: Troubleshooting

### Issue: "schemes table not found"

**Cause:** Migrations didn't run  
**Fix:**
```bash
docker compose exec api alembic upgrade head
```

### Issue: "Still seeing only 15 schemes"

**Cause:** Import script didn't run or had errors  
**Fix:**
```bash
# Check if scraped_schemes.json exists
ls -la packages/scraper/scraped_schemes.json

# Re-run import with verbose output
docker compose exec api python -u packages/scraper/import_to_db.py
```

### Issue: "Chat responses don't mention scheme details"

**Cause:** Pinecone not indexed  
**Fix:**
```bash
docker compose exec api python packages/embeddings/index_schemes.py
```

### Issue: "Database URL not found"

**Cause:** .env not loaded  
**Fix:** Make sure your `.env` file exists and has `DATABASE_URL` set:
```bash
cat /Users/shikher/projects/sahayak/.env | grep DATABASE_URL
```

### Issue: "ModuleNotFoundError" when running import

**Cause:** Docker image wasn't rebuilt with latest dependencies  
**Fix:**
```bash
docker compose down
docker system prune -a
./restart.sh
```

---

## Part 6: API Endpoints to Test

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Get All Schemes
```bash
curl http://localhost:8000/api/schemes?limit=10
```

### RAG Query (No History)
```bash
curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is PM Kisan?"}'
```

### RAG Stream (With History)
```bash
curl -X POST http://localhost:8000/api/rag/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How much does it give?",
    "history": [
      {"role": "user", "content": "What is PM Kisan?"},
      {"role": "assistant", "content": "PM Kisan is a direct income support scheme for farmers..."}
    ]
  }'
```

### Check Pinecone Index Stats
```bash
curl http://localhost:8000/api/health/pinecone
```

---

## Part 7: Cleanup & Reset

### Stop Services (Keep Docker images)
```bash
docker compose stop
```

### Clear Database & Restart Fresh
```bash
docker compose down -v
./restart.sh
```

### View Live Logs
```bash
docker compose logs -f web api postgres
```

### Stop Tailing Logs But Keep Services Running
```bash
# Press Ctrl+C in the terminal where restart.sh is running
# Services keep running in the background
```

---

## Summary of What Changed

| Area | Change | How to Verify |
|------|--------|---------------|
| **Schemes Data** | 15 → 61+ schemes | Check schemes page, database count |
| **RAG Pipeline** | Added chat history support | Type follow-up questions, AI remembers context |
| **UI - Cards** | Fixed benefit text overlap, added category icons | Open schemes page, check card layout |
| **UI - Home** | New hero section, category grid, trust pillars | Open home page, see new design |
| **UI - Navigation** | Mobile bottom nav added | View on mobile or resize to 375px |
| **UI - Skeletons** | Loading states on schemes page | Open schemes page while loading |
| **Database** | Import tool for bulk scheme additions | Run import_to_db.py script |
| **Embeddings** | Re-index script for Pinecone | Run index_schemes.py after import |

---

## Next Steps

Once you've verified everything works locally:

1. ✅ Push any uncommitted changes:
   ```bash
   git add .
   git commit -m "Test changes"
   git push origin feat/scheme-scraper
   ```

2. ✅ Create/Review PR #4 to merge into `main`

3. ✅ Deploy to Railway and run import/reindex commands on Railway shell

4. ✅ Verify production environment works the same way

---

**Questions?** Check the logs:
```bash
docker compose logs api  # See API errors
docker compose logs web  # See frontend errors
```
