#!/bin/sh
set -e

echo "Waiting for database to be ready (postgres:5432)..."
# Simple wait loop for postgres using nc (netcat)
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up - executing migrations/schema sync"
# Ensure the client is generated
npx prisma generate

echo "Dropping any problematic constraints before push..."
npx ts-node prisma/drop-constraint.ts || true

# Sync schema to database
# --accept-data-loss is used here to allow rapid development changes
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed

echo "Starting application..."
# Start the application
exec node dist/index.js
