#!/usr/bin/env bash
# Stop the live backend (keeps the docker network and the built core image).
docker rm -f diigoo-erp-core diigoo-erp-db >/dev/null 2>&1 || true
echo "✓ Backend stopped. To return the web app to the zero-dependency demo,"
echo "  delete apps/web/.env.local (or set DATA_ADAPTER=mock) and restart pnpm dev."
