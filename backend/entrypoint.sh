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

# Sync schema to database
# --accept-data-loss is used here to allow rapid development changes
npx prisma db push --accept-data-loss

echo "Starting application..."
# Start the application
exec npm run dev
