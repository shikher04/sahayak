#!/bin/bash
set -e

echo "🚀 Starting Sahayak..."

# Start all services
docker compose up --build -d

# Wait for PostgreSQL to be healthy
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U sahayak -d sahayak > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL ready"

# Wait for API to be healthy
echo "⏳ Waiting for API..."
until curl -s http://localhost:8000/api/health > /dev/null 2>&1; do
  sleep 2
done
echo "✅ API ready"

# Run migrations
echo "⏳ Running migrations..."
docker compose exec -T api alembic upgrade head
echo "✅ Migrations done"

# Seed data
echo "⏳ Seeding database..."
docker compose exec -T api python scripts/seed.py
echo "✅ Seed done"

echo ""
echo "✅ Sahayak is running!"
echo "   Frontend → http://localhost:3000"
echo "   API docs → http://localhost:8000/api/docs"
echo ""
echo "Tailing logs (Ctrl+C to stop watching, services keep running)..."
docker compose logs -f web api
