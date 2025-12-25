#!/bin/bash

# Development Environment Stop Script
# Stops the development environment and optionally cleans up resources

set -e

echo "🛑 Stopping Cody Richter Cooks Development Environment..."

# Parse command line arguments
CLEANUP=false
VOLUMES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --volumes)
            VOLUMES=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --cleanup    Remove containers after stopping"
            echo "  --volumes    Remove volumes (WARNING: This will delete database data)"
            echo "  --help       Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Stop services
echo "⏹️  Stopping services..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop

if [ "$CLEANUP" = true ]; then
    echo "🧹 Removing containers..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

    if [ "$VOLUMES" = true ]; then
        echo "⚠️  Removing volumes (this will delete database data)..."
        read -p "Are you sure? This will permanently delete all database data. (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
            echo "🗑️  Volumes removed"
        else
            echo "📦 Volumes preserved"
        fi
    fi
fi

echo "✅ Development environment stopped"

# Show remaining containers if any
RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null || true)
if [ -n "$RUNNING_CONTAINERS" ]; then
    echo ""
    echo "ℹ️  Some containers may still be running:"
    docker-compose ps
fi
