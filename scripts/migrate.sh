#!/bin/bash

# Database Migration Script
# Runs Alembic database migrations through Docker

set -e

echo "🔄 Running Database Migrations..."

# Check if backend container is running
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Error: Backend service is not running."
    echo "   Please start the development environment first:"
    echo "   ./scripts/dev-start.sh"
    exit 1
fi

# Check if database is healthy
echo "🔍 Checking database connection..."
if ! docker-compose exec database pg_isready -U recipe_user -d recipe_db > /dev/null 2>&1; then
    echo "❌ Error: Database is not ready. Waiting for database to be available..."

    # Wait up to 30 seconds for database to be ready
    for i in {1..30}; do
        if docker-compose exec database pg_isready -U recipe_user -d recipe_db > /dev/null 2>&1; then
            echo "✅ Database is ready"
            break
        fi
        echo "   Waiting... ($i/30)"
        sleep 1
    done

    if [ $i -eq 30 ]; then
        echo "❌ Error: Database failed to become ready within 30 seconds"
        echo "   Check database logs: docker-compose logs database"
        exit 1
    fi
fi

# Run migrations
echo "📊 Applying database migrations..."
docker-compose exec backend alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"

    # Show current migration status
    echo ""
    echo "📋 Current migration status:"
    docker-compose exec backend alembic current
else
    echo "❌ Migration failed"
    echo "   Check backend logs: docker-compose logs backend"
    exit 1
fi

echo ""
echo "💡 Tip: To create a new migration, use:"
echo "   ./scripts/migrate-create.sh \"Your migration description\""
