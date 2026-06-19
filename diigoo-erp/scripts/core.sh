#!/usr/bin/env bash
# Run the native backend: native PostgreSQL 16 + the Rust core (no Docker).
# Terminal 1:  bash scripts/core.sh      (this — the backend)
# Terminal 2:  pnpm dev                  (the web app, already in core mode)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="$(brew --prefix postgresql@16 2>/dev/null)/bin"

echo "▸ Ensuring PostgreSQL 16 is running…"
brew services start postgresql@16 >/dev/null 2>&1 || true
for i in $(seq 1 20); do "$PGBIN/pg_isready" -q 2>/dev/null && break; sleep 1; done

# First-time DB setup (idempotent): role + database + schema/seed.
if ! "$PGBIN/psql" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='diigoo_erp'" 2>/dev/null | grep -q 1; then
  echo "▸ Creating role + database…"
  "$PGBIN/psql" -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='diigoo') THEN CREATE ROLE diigoo LOGIN PASSWORD 'diigoo' SUPERUSER; END IF; END \$\$;"
  "$PGBIN/createdb" -O diigoo diigoo_erp
  "$PGBIN/psql" -U diigoo -d diigoo_erp -q \
    -f "$ROOT/db/migrations/0001_init.sql" \
    -f "$ROOT/db/migrations/0002_seed.sql" \
    -f "$ROOT/db/migrations/0003_auth.sql"
fi

BIN="$ROOT/services/core/target/release/gateway"
if [ ! -x "$BIN" ]; then
  echo "▸ Building the Rust core (first run, a few minutes)…"
  ( cd "$ROOT/services/core" && cargo build --release -p gateway )
fi

echo "▸ Starting the Rust core on http://localhost:8080  (Ctrl+C to stop)"
exec env \
  DATABASE_URL='postgres://diigoo_app:diigoo_app@localhost:5432/diigoo_erp' \
  BIND_ADDR=0.0.0.0:8080 JWT_SECRET=dev-secret-change-me JWT_ISSUER=diigoo-erp RUST_LOG=info \
  "$BIN"
