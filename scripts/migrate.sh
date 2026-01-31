#!/bin/bash

# Database Migration Script
# Runs Alembic database migrations through Docker

set -e

echo "🔄 Running Database Migrations..."

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Allow overriding DATABASE_URL from command line argument
if [ ! -z "$1" ]; then
    export DATABASE_URL="$1"
    echo "📌 Using provided DATABASE_URL from argument"
fi

# Determine if we are running against a local or remote database
IS_REMOTE=false
if [[ "${DATABASE_URL}" != *"@database:"* ]] && [[ "${DATABASE_URL}" != *"@localhost:"* ]] && [ ! -z "${DATABASE_URL}" ]; then
    IS_REMOTE=true
fi

if [ "$IS_REMOTE" = true ]; then
    echo "🌐 Detected remote database connection."
else
    echo "🏠 Detected local database connection."

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
fi

# Run migrations using 'docker-compose run' to ensure the container is started if needed
echo "📊 Applying database migrations..."

# We use --rm to remove the container after it finishes
# We pass DATABASE_URL explicitly to override whatever is in docker-compose.yml if needed
docker-compose run --rm \
    -e DATABASE_URL="${DATABASE_URL}" \
    backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "💡 Tip: To run migrations against a specific database, use:"
echo "   ./scripts/migrate.sh \"postgresql://user:pass@host:port/dbname\""
