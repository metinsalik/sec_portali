#!/bin/sh
set -e

echo "Waiting for database to be ready (postgres:5432)..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready."
echo "Syncing database schema (prisma db push)..."
node --no-maglev /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss || echo "Schema sync notice: continuing application startup..."

echo "Starting application..."
exec node dist/index.js
