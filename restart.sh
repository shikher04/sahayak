#!/bin/bash
set -e

echo "🔄 Restarting Sahayak..."

# Stop everything
docker compose down

# Start all services fresh with latest env
docker compose up --build -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U sahayak -d sahayak > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL ready"

# Wait for API
echo "⏳ Waiting for API..."
until curl -s http://localhost:8000/api/health > /dev/null 2>&1; do
  sleep 2
done
echo "✅ API ready"

# Run migrations (safe to run multiple times)
echo "⏳ Running migrations..."
docker compose exec -T api alembic upgrade head
echo "✅ Migrations done"

# Seed only if schemes table is empty
SCHEME_COUNT=$(docker compose exec -T postgres psql -U sahayak -d sahayak -tAc "SELECT COUNT(*) FROM schemes;" 2>/dev/null || echo "0")
if [ "$SCHEME_COUNT" -eq "0" ] 2>/dev/null; then
  echo "⏳ Seeding database..."
  docker compose exec -T api python scripts/seed.py
  echo "✅ Seed done"
else
  echo "✅ Database already seeded ($SCHEME_COUNT schemes)"
fi

echo ""
echo "✅ Sahayak is running!"
echo "   Frontend → http://localhost:3000"
echo "   API docs → http://localhost:8000/api/docs"
echo ""
echo "Tailing logs (Ctrl+C to stop watching, services keep running)..."
docker compose logs -f web api
