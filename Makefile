.PHONY: dev migrate seed index test clean build logs shell-api shell-web

# ── Development ────────────────────────────────────────
dev:
	docker compose up --build

dev-d:
	docker compose up --build -d

stop:
	docker compose down

# ── Database ────────────────────────────────────────────
migrate:
	docker compose exec api alembic upgrade head

migrate-down:
	docker compose exec api alembic downgrade -1

migration:
	docker compose exec api alembic revision --autogenerate -m "$(name)"

seed:
	docker compose exec api python scripts/seed.py

# ── AI / RAG ────────────────────────────────────────────
index:
	docker compose run --rm -v $(PWD)/packages:/packages -e PYTHONPATH=/app api python /packages/embeddings/index_schemes.py

# ── Testing ─────────────────────────────────────────────
test:
	docker compose exec api pytest -v
	cd apps/web && npm test -- --watchAll=false

test-api:
	docker compose exec api pytest -v --cov=. --cov-report=html

test-web:
	cd apps/web && npm test -- --watchAll=false --coverage

# ── Build ───────────────────────────────────────────────
build:
	npm run build

# ── Logs ────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-web:
	docker compose logs -f web

# ── Shells ──────────────────────────────────────────────
shell-api:
	docker compose exec api bash

shell-web:
	docker compose exec web sh

shell-db:
	docker compose exec postgres psql -U sahayak -d sahayak

# ── Cleanup ─────────────────────────────────────────────
clean:
	docker compose down -v
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf apps/web/.next apps/web/node_modules
	npm run clean
