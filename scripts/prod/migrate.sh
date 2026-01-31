#!/bin/bash

# Production/Remote Database Migration Script
# This script targets remote databases. Use with caution.

set -e

echo "🌐 Running Remote Database Migrations..."

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Allow overriding DATABASE_URL from command line argument
if [ ! -z "$1" ]; then
    export DATABASE_URL="$1"
    echo "📌 Using provided DATABASE_URL from argument"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set."
    echo "   Usage: ./scripts/prod/migrate.sh \"postgresql://user:pass@host:port/dbname\""
    exit 1
fi

# Safety check: Warn if it looks local
if [[ "${DATABASE_URL}" == *"@database:"* ]] || [[ "${DATABASE_URL}" == *"@localhost:"* ]] || [[ "${DATABASE_URL}" == *"@127.0.0.1:"* ]]; then
    echo "⚠️  Warning: This looks like a LOCAL database URL."
    echo "   DATABASE_URL: ${DATABASE_URL}"
    echo "   If you want to run local migrations, use scripts/local/migrate.sh"
    read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Target: Remote Database"
echo "📊 Applying database migrations..."

# Run migrations using 'docker-compose run'
# NOTE: This still uses the local backend container to run Alembic against the remote DB
docker-compose run --rm \
    -e DATABASE_URL="${DATABASE_URL}" \
    backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Remote database migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi
