# Sahayak — Government Schemes & Legal Rights Platform

AI-powered platform helping Indian citizens discover government schemes they're eligible for and understand their legal rights — in 10 Indian languages.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript strict, Tailwind CSS |
| i18n | next-intl (10 locales: en, hi, ta, te, mr, bn, gu, kn, ml, pa) |
| State | Zustand (UI) + React Query (server state) |
| Auth | NextAuth.js v5 (Aadhaar OTP, DigiLocker, Guest) |
| Backend | Python 3.11, FastAPI, Pydantic v2 |
| Database | PostgreSQL 16, SQLAlchemy 2.0 async + Alembic |
| Cache | Redis 7, aioredis |
| Queue | Celery + Redis |
| AI | Anthropic Claude claude-sonnet-4-5 (streaming) |
| Vector DB | Pinecone (serverless, 1024-dim, cosine) |
| Embeddings | intfloat/multilingual-e5-large |
| Reranking | Cohere rerank-multilingual-v3.0 |

## Monorepo Structure

```
sahayak/
├── apps/
│   ├── web/                 Next.js frontend
│   └── api/                 FastAPI backend
├── packages/
│   ├── scraper/             scheme data scraper
│   ├── embeddings/          Pinecone indexing pipeline
│   └── shared-types/        TypeScript types
├── docker-compose.yml
├── turbo.json
└── Makefile
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### 1. Clone and configure

```bash
git clone <repo-url>
cd sahayak
cp .env.example .env
# Edit .env with your API keys
```

### 2. Required API Keys (in `.env`)

```
ANTHROPIC_API_KEY=      # Anthropic Console: console.anthropic.com
PINECONE_API_KEY=       # Pinecone: app.pinecone.io
COHERE_API_KEY=         # Cohere: dashboard.cohere.com
NEXTAUTH_SECRET=        # Generate: openssl rand -base64 32
```

### 3. Start all services

```bash
make dev
```

This starts: PostgreSQL, Redis, FastAPI API (port 8000), Next.js web (port 3000), Celery worker.

### 4. Run migrations and seed data

```bash
make migrate     # Runs: alembic upgrade head
make seed        # Seeds 15 schemes + 10 legal rights
```

### 5. Index data into Pinecone

```bash
make index       # Embeds all schemes/rights and upserts to Pinecone
```

### 6. Open the app

- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/api/docs

## Development Commands

```bash
make dev           # Start all services with hot reload
make stop          # Stop all services
make migrate       # Run pending migrations
make seed          # Seed the database
make index         # Run Pinecone indexing pipeline
make test          # Run all tests (pytest + jest)
make test-api      # API tests only
make logs          # Follow all service logs
make shell-api     # Open shell in API container
make shell-db      # Open psql shell
make clean         # Destroy volumes and node_modules
```

## Architecture

### RAG Pipeline (8 steps)

```
User Query (any language)
    │
    ▼
1. Detect language (langdetect)
    │
    ▼
2. Translate to English if needed (Claude)
    │
    ▼
3. Embed query (multilingual-e5-large, 1024-dim)
    │
    ▼
4. Query Pinecone (top-8, with metadata filters)
    │
    ▼
5. Rerank results (Cohere, keep top-3)
    │
    ▼
6. Build prompt (context + user profile)
    │
    ▼
7. Stream Claude response (SSE, token-by-token)
    │
    ▼
8. Return answer + source citations
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/schemes | List schemes (filterable, paginated) |
| GET | /api/schemes/:id | Single scheme detail |
| POST | /api/eligibility/check | Check eligibility, returns matched schemes |
| GET | /api/rights | List legal rights |
| POST | /api/rag/stream | Streaming RAG chat (SSE) |
| POST | /api/rag/translate | Translate text via Claude |
| POST | /api/profile | Save user profile |
| GET | /api/profile | Get user profile |
| POST | /api/auth/aadhaar/send-otp | Send Aadhaar OTP |
| POST | /api/auth/aadhaar/verify-otp | Verify OTP, return JWT |
| POST | /api/auth/guest | Create guest session |

### Database Schema

```
users ─── profiles          (1:1)
users ─── chat_sessions     (1:many)
users ─── saved_schemes     (many:many via saved_schemes)
chat_sessions ─── chat_messages  (1:many)
schemes (standalone)
rights  (standalone)
```

## Frontend Pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Hero, search, quick actions, stats |
| Schemes | `/schemes` | Filterable scheme list |
| Legal Rights | `/rights` | Rights cards with action steps |
| Eligibility | `/eligibility` | 4-step wizard |
| AI Chat | `/chat` | Streaming RAG chat interface |
| Profile | `/profile` | Personal details + document checklist |
| Login | `/login` | Aadhaar OTP / Guest login |

## Authentication

### Aadhaar OTP (Sandbox)
1. Enter 12-digit Aadhaar number
2. Click "Send OTP" → backend calls UIDAI sandbox
3. Enter OTP (use `123456` in development)
4. JWT session created, valid 7 days

### Guest Mode
Click "Continue as Guest" — full access to schemes/rights/chat. Profile not persisted.

## i18n

Translation files are at `apps/web/messages/{locale}.json`.

Supported locales: `en`, `hi`, `ta`, `te`, `mr`, `bn`, `gu`, `kn`, `ml`, `pa`

The middleware (`apps/web/middleware.ts`) detects browser language and redirects automatically.

## Environment Variables

See `.env.example` for full list. Key variables:

```bash
# AI
ANTHROPIC_API_KEY=           # Required for chat
PINECONE_API_KEY=            # Required for RAG
COHERE_API_KEY=              # Required for reranking

# Database (auto-set in docker-compose)
DATABASE_URL=postgresql+asyncpg://sahayak:password@localhost:5432/sahayak
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=             # Required (any random string)
NEXTAUTH_URL=http://localhost:3000

# UIDAI (Aadhaar — sandbox)
UIDAI_AUA_CODE=
UIDAI_LICENSE_KEY=

# DigiLocker
DIGILOCKER_CLIENT_ID=
DIGILOCKER_CLIENT_SECRET=
```

## Testing

```bash
# API tests
cd apps/api
pytest -v --cov=.

# Frontend type check
cd apps/web
npx tsc --noEmit
```

## Production Deployment

1. Set all environment variables in your deployment platform
2. Run `alembic upgrade head` for migrations
3. Run `python scripts/seed.py` to seed initial data
4. Run `python packages/embeddings/index_schemes.py` to build the Pinecone index
5. Deploy API with `uvicorn main:app --host 0.0.0.0 --port 8000`
6. Deploy frontend with `next build && next start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the coding standards in `CLAUDE.md`
4. Open a PR against `develop`

## License

MIT — For informational purposes only. Official government scheme applications must be submitted through respective government portals.
