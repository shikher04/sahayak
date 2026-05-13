# Sahayak — Deployment Guide

This document captures the deployment architecture and the exact steps followed to deploy the project to production.

## Architecture Overview

| Layer    | Service        | Platform  |
|----------|----------------|-----------|
| Frontend | Next.js 14     | Vercel    |
| Backend  | FastAPI (Python 3.11) | Railway |
| Database | PostgreSQL     | Railway   |

The frontend proxies all `/api/*` requests to the Railway backend via a `vercel.json` rewrite rule — no CORS issues, no exposed backend URL in the browser.

---

## Backend — Railway (FastAPI)

### 1. Connect the repository to Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Select the `sahayak` repo and point Railway at the `apps/api` service root (or configure the root directory in the Railway service settings).

### 2. Provision a PostgreSQL database

In the same Railway project, add a **PostgreSQL** plugin. Railway automatically injects a `DATABASE_URL` environment variable in `postgres://...` format into all services in the project.

> **Important:** Railway provides the URL as `postgres://...` but SQLAlchemy's asyncpg driver requires `postgresql+asyncpg://...`. The app handles this automatically via the `async_database_url` property in `config.py`.

### 3. Set environment variables in Railway

Go to the service **Variables** tab and add:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Auto-injected by Railway Postgres plugin |
| `GROQ_API_KEY` | Groq cloud LLM key |
| `ANTHROPIC_API_KEY` | Optional — Anthropic key |
| `PINECONE_API_KEY` | Pinecone vector DB key |
| `PINECONE_INDEX_NAME` | e.g. `sahayak-schemes` |
| `COHERE_API_KEY` | Cohere reranking key |
| `NEXTAUTH_SECRET` | Must match the value set in Vercel |
| `LLM_PROVIDER` | `groq` for production |
| `REDIS_URL` | Redis connection URL (add a Redis plugin or external) |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (your Vercel URL) |

### 4. Configure the Railway service (`apps/api/railway.json`)

The final working `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "sh -c 'uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}'",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

Key decisions made during deployment:

- **`sh -c '...'` wrapper** — required so that shell variable expansion (`${PORT:-8000}`) works. Without it, Railway passes the string literally and `$PORT` is never substituted.
- **Migrations run separately** — we removed `alembic upgrade head &&` from the `startCommand` to avoid migration timeouts blocking the health check. Run migrations manually via the Railway shell (see below).
- **Healthcheck timeout set to 120s** — the default 60s was too short for the first cold start while dependencies load.
- **Seed script removed from start command** — `python scripts/seed.py` was only needed once; running it on every deploy is wasteful and slow.

### 5. Run database migrations manually

After the first deploy (or after any migration-adding commit), open the Railway service shell:

```bash
# Railway dashboard → service → Shell tab
alembic upgrade head
```

Optionally seed initial data once:

```bash
python scripts/seed.py
```

### 6. Verify the backend is live

```
GET https://<your-railway-url>/api/health
# Expected: {"status": "ok", "service": "sahayak-api"}
```

---

## Frontend — Vercel (Next.js)

### 1. Connect the repository to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**.
2. Set the **Root Directory** to `apps/web`.
3. Framework preset will auto-detect **Next.js**.

### 2. Set environment variables in Vercel

Go to **Project Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Must match the value set in Railway |
| `NEXTAUTH_URL` | Your production Vercel URL, e.g. `https://sahayak.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same as above |

> Do **not** put secret keys or Railway internal URLs in Vercel env vars — they are exposed in the build logs. API calls go through the rewrite proxy instead.

### 3. Configure the Vercel rewrite (`apps/web/vercel.json`)

All `/api/*` requests from the browser are rewritten server-side to the Railway backend URL:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["bom1"],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://skillful-amazement-production.up.railway.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

Key decisions:

- **Region `bom1` (Mumbai)** — closest to Indian users.
- **No secret references in `vercel.json`** — Vercel rejected deployments when `vercel.json` referenced `@secret-name` variables. All secrets go through the Vercel dashboard instead.
- **Rewrite destination uses the Railway public URL** — this was updated from the placeholder `your-api.railway.app` to the actual deployed URL `skillful-amazement-production.up.railway.app`.

### 4. Verify the frontend is live

Visit your Vercel URL. The app should load and `/api/health` (proxied through Vercel) should return the health response from Railway.

---

## Issues Encountered & Fixes Applied

| Commit | Issue | Fix |
|---|---|---|
| `b263ce6` | Railway provides `postgres://` but SQLAlchemy requires `postgresql+asyncpg://` | Added `async_database_url` property in `config.py` that auto-converts the scheme |
| `d24c669` | Healthcheck failing on cold start (60s too short) | Increased `healthcheckTimeout` to 300s (later settled at 120s); removed seed script from start command |
| `4b3fe29` | Migrations + uvicorn in one command caused Railway to time out before the app was ready | Separated concerns: removed `alembic upgrade head` from `startCommand`, run via shell manually |
| `46d4a77` | `$PORT` variable not expanding in Railway start command | Wrapped command in `sh -c '...'` to enable shell variable expansion |
| `9ceec40` | Vercel build rejected `vercel.json` containing `@secret-name` references | Removed all secret references from `vercel.json`; use Vercel dashboard env vars instead |
| `439819f` | Vercel build failing because `@sahayak/shared-types` package not resolvable | Inlined the `UserProfile` type directly in `useAppStore.ts` to remove the cross-package dependency |
| `576c2dd` | Frontend hitting wrong Railway URL (placeholder left from initial setup) | Updated `vercel.json` rewrite destination to the correct Railway URL |

---

## Local Development

```bash
# Start all services with Docker Compose
docker compose up

# Or run individually
cd apps/api && uvicorn main:app --reload
cd apps/web && npm run dev
```

The `docker-compose.yml` at the repo root includes Postgres and Redis for local use.
