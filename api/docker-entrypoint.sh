#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed || echo "Seed may have already run"

echo "Starting application..."
exec node dist/main.js
