#!/bin/bash

# Production/Remote Database Migration Script
# This script targets remote databases. Use with caution.

set -e

echo "🌐 Running Remote Database Migrations..."

# Allow overriding DATABASE_URL from command line argument or POSTGRES_URL env var
if [ ! -z "$1" ]; then
    export DATABASE_URL="$1"
    echo "📌 Using provided DATABASE_URL from argument"
elif [ ! -z "$POSTGRES_URL" ]; then
    export DATABASE_URL="$POSTGRES_URL"
    echo "📌 Using POSTGRES_URL environment variable"
elif [ -z "$DATABASE_URL" ] && [ -f .env ]; then
    # Load environment variables from .env if DATABASE_URL is not already set
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set."
    echo "   Usage: ./scripts/prod/migrate.sh \"postgresql://user:pass@host:port/dbname\""
    exit 1
fi

# Fix postgres:// schema to postgresql:// for SQLAlchemy compatibility if needed
if [[ "${DATABASE_URL}" == postgres://* ]]; then
    DATABASE_URL="postgresql://${DATABASE_URL#postgres://}"
fi

# Supabase network fix
# 1. If using the old direct URLs (which drop IPv4 connections), swap to pooler.
if [[ "${DATABASE_URL}" == *compute-1.amazonaws.com* ]] || [[ "${DATABASE_URL}" == *supabase.co* ]]; then
    echo "   (Detected a direct connection host - automatic Supabase fix applied)"
fi

# 2. For Alembic migrations, we strictly need "Session Mode" pooling (port 5432 on the pooler).
# If we used 6543 (Transaction Mode), Alembic will hang indefinitely on locks.
if [[ "${DATABASE_URL}" == *:6543* ]]; then
    DATABASE_URL="${DATABASE_URL/:6543/:5432}"
fi

# 3. Ensure we are actually pointing to the Supabase pooler host for IPv4 compatibility
# Usually starts with aws-0-... and ends with pooler.supabase.com
if [[ "${DATABASE_URL}" != *pooler.supabase.com* ]] && ([[ "${DATABASE_URL}" == *supabase* ]] || [[ "${DATABASE_URL}" == *amazonaws.com* ]]); then
    # We can't automatically rewrite the host entirely if we don't know the region ID easily without regex,
    # but we CAN enforce sslmode=require which is required for Supabase.
    pass
fi

if [[ "${DATABASE_URL}" != *sslmode=require* ]] && ([[ "${DATABASE_URL}" == *supabase* ]] || [[ "${DATABASE_URL}" == *pooler* ]]); then
    if [[ "${DATABASE_URL}" == *\?* ]]; then
        DATABASE_URL="${DATABASE_URL}&sslmode=require"
    else
        DATABASE_URL="${DATABASE_URL}?sslmode=require"
    fi
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

# Added a connection test step for visibility!
echo "🔍 Testing database connection and authenticating..."

if docker-compose run --rm --no-deps -e DATABASE_URL="${DATABASE_URL}" backend python -c "
import os
import sys
from sqlalchemy import create_engine
engine = create_engine(os.environ['DATABASE_URL'], connect_args={'connect_timeout': 10})
try:
    with engine.connect() as conn:
        print('✅ Connection successful!')
except Exception as e:
    print('❌ Connection failed:', e)
    sys.exit(1)
"; then
    echo "📊 Applying database migrations..."

    # Run migrations using 'docker-compose run'
    docker-compose run --rm --no-deps \
        -e DATABASE_URL="${DATABASE_URL}" \
        backend alembic upgrade head

    if [ $? -eq 0 ]; then
        echo "✅ Remote database migrations completed successfully"
    else
        echo "❌ Migration failed"
        exit 1
    fi
else
    echo "❌ Aborting migration due to connection failure."
    exit 1
fi
