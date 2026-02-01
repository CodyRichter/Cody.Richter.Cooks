#!/bin/bash

# Local Database Migration Script
# Only for local development environment

set -e

echo "🏠 Running Local Database Migrations..."

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Hardcode to local database connection if not set
if [ -z "$DATABASE_URL" ]; then
    # Fallback to default local compose url if not in .env
    export DATABASE_URL="postgresql://${POSTGRES_USER:-recipe_user}:${POSTGRES_PASSWORD:-recipe_pass}@database:5432/${POSTGRES_DB:-recipe_db}"
fi

# Safety check: Prevent running against remote DB
if [[ "${DATABASE_URL}" != *"@database:"* ]] && [[ "${DATABASE_URL}" != *"@localhost:"* ]] && [[ "${DATABASE_URL}" != *"@127.0.0.1:"* ]]; then
    echo "❌ Error: This script is for LOCAL migrations only."
    echo "   Detected remote DATABASE_URL: ${DATABASE_URL}"
    echo "   Use scripts/prod/migrate.sh for remote databases."
    exit 1
fi

# Check if database service is defined and running (or start it)
if docker-compose ps database 2>/dev/null | grep -q "database"; then
    echo "🔍 Checking local database readiness..."
    # Wait up to 30 seconds for database to be ready
    for i in {1..30}; do
        if docker-compose exec -T database pg_isready -U ${POSTGRES_USER:-recipe_user} -d ${POSTGRES_DB:-recipe_db} > /dev/null 2>&1; then
            echo "✅ Database is ready"
            break
        fi
        echo "   Waiting for database... ($i/30)"
        sleep 1
    done

    if [ $i -eq 30 ]; then
        echo "❌ Error: Database failed to become ready within 30 seconds"
        exit 1
    fi
fi

# Run migrations using 'docker-compose run'
echo "📊 Applying database migrations..."

docker-compose run --rm \
    -e DATABASE_URL="${DATABASE_URL}" \
    backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Local database migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi
