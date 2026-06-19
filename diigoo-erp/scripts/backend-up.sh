#!/usr/bin/env bash
# Bring up the live backend: PostgreSQL (schema + seed) + the Rust core.
# Uses an isolated docker network; the DB has no published host port (the core
# reaches it over the network), so it won't clash with other Postgres you run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NET=diigoo-erp-net

docker network create "$NET" >/dev/null 2>&1 || true

echo "▸ Starting Postgres (schema + seed applied on first boot)…"
docker rm -f diigoo-erp-db >/dev/null 2>&1 || true
docker run -d --name diigoo-erp-db --network "$NET" \
  -e POSTGRES_USER=diigoo -e POSTGRES_PASSWORD=diigoo -e POSTGRES_DB=diigoo_erp \
  -v "$ROOT/db/migrations":/docker-entrypoint-initdb.d:ro \
  postgres:16-alpine >/dev/null

echo "▸ Waiting for the database to seed…"
for i in $(seq 1 40); do
  if docker exec diigoo-erp-db psql -U diigoo -d diigoo_erp -tAc "select count(*) from hr_employees" >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "▸ Building the Rust core image (first run only; a few minutes)…"
DOCKER_BUILDKIT=0 docker build -t diigoo-core "$ROOT/services/core" >/dev/null

echo "▸ Starting the Rust core on http://localhost:8080 …"
docker rm -f diigoo-erp-core >/dev/null 2>&1 || true
docker run -d --name diigoo-erp-core --network "$NET" \
  -e DATABASE_URL=postgres://diigoo_app:diigoo_app@diigoo-erp-db:5432/diigoo_erp \
  -e BIND_ADDR=0.0.0.0:8080 -p 8080:8080 diigoo-core >/dev/null

echo ""
echo "✓ Backend up.  Core health: http://localhost:8080/health"
echo "  Now run the web app in core mode:  pnpm dev   (apps/web/.env.local already points at the core)"
echo "  Open http://localhost:3000/hrm/employees — the table shows 'Live · Rust + Postgres'."
