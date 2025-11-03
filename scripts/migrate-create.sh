#!/bin/bash

# Create New Database Migration Script
# Creates a new Alembic migration file through Docker

set -e

# Check if migration message is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Migration message is required"
    echo ""
    echo "Usage: $0 \"Migration description\""
    echo ""
    echo "Examples:"
    echo "  $0 \"Add user table\""
    echo "  $0 \"Add recipe and ingredient models\""
    echo "  $0 \"Add indexes for recipe search\""
    echo ""
    exit 1
fi

MIGRATION_MESSAGE="$1"

echo "📝 Creating new database migration: \"$MIGRATION_MESSAGE\""

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
    echo "❌ Error: Database is not ready."
    echo "   Please ensure the database is running and healthy."
    exit 1
fi

# Create the migration
echo "🔧 Generating migration file..."
docker-compose exec backend alembic revision --autogenerate -m "$MIGRATION_MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ Migration file created successfully"
    
    # Show the latest migration files
    echo ""
    echo "📁 Latest migration files:"
    docker-compose exec backend find alembic/versions -name "*.py" -type f -exec basename {} \; | tail -3
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the generated migration file in backend/alembic/versions/"
    echo "2. Edit the migration if needed to add custom logic"
    echo "3. Apply the migration with: ./scripts/migrate.sh"
    
else
    echo "❌ Failed to create migration"
    echo "   Check backend logs: docker-compose logs backend"
    exit 1
fi

echo ""
echo "💡 Tips:"
echo "   - Always review generated migrations before applying"
echo "   - Test migrations on a copy of production data"
echo "   - Consider data migration scripts for complex changes"