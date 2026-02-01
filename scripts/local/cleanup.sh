#!/bin/bash

# Docker Cleanup Script
# Cleans up Docker resources (containers, images, volumes, networks)

set -e

echo "🧹 Docker Cleanup Script"

# Parse command line arguments
CONTAINERS=false
IMAGES=false
VOLUMES=false
NETWORKS=false
ALL=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --containers)
            CONTAINERS=true
            shift
            ;;
        --images)
            IMAGES=true
            shift
            ;;
        --volumes)
            VOLUMES=true
            shift
            ;;
        --networks)
            NETWORKS=true
            shift
            ;;
        --all)
            ALL=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --containers  Remove stopped containers"
            echo "  --images      Remove dangling and unused images"
            echo "  --volumes     Remove unused volumes (WARNING: Data loss)"
            echo "  --networks    Remove unused networks"
            echo "  --all         Clean up everything (containers, images, volumes, networks)"
            echo "  --force       Skip confirmation prompts"
            echo "  --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --containers           # Remove stopped containers"
            echo "  $0 --images               # Remove unused images"
            echo "  $0 --all                  # Clean up everything"
            echo "  $0 --all --force          # Clean up everything without prompts"
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

# If no specific options, default to basic cleanup
if [ "$CONTAINERS" = false ] && [ "$IMAGES" = false ] && [ "$VOLUMES" = false ] && [ "$NETWORKS" = false ] && [ "$ALL" = false ]; then
    CONTAINERS=true
    IMAGES=true
fi

# Set all flags if --all is specified
if [ "$ALL" = true ]; then
    CONTAINERS=true
    IMAGES=true
    VOLUMES=true
    NETWORKS=true
fi

# Confirmation prompt for destructive operations
if [ "$VOLUMES" = true ] && [ "$FORCE" = false ]; then
    echo "⚠️  WARNING: This will remove Docker volumes and may cause data loss!"
    echo "   This includes database data and uploaded files."
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
fi

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

echo "🔍 Analyzing Docker resources..."

# Stop recipe-related containers first
echo "⏹️  Stopping Cody Richter Cooks application containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || true

# Clean up containers
if [ "$CONTAINERS" = true ]; then
    echo "🗑️  Removing stopped containers..."

    STOPPED_CONTAINERS=$(docker ps -aq --filter "status=exited")
    if [ -n "$STOPPED_CONTAINERS" ]; then
        docker rm $STOPPED_CONTAINERS
        echo "   ✅ Removed stopped containers"
    else
        echo "   ℹ️  No stopped containers to remove"
    fi

    # Remove recipe-specific containers
    RECIPE_CONTAINERS=$(docker ps -aq --filter "name=recipe-")
    if [ -n "$RECIPE_CONTAINERS" ]; then
        docker rm -f $RECIPE_CONTAINERS 2>/dev/null || true
        echo "   ✅ Removed Cody Richter Cooks application containers"
    fi
fi

# Clean up images
if [ "$IMAGES" = true ]; then
    echo "🖼️  Removing unused images..."

    # Remove dangling images
    DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
    if [ -n "$DANGLING_IMAGES" ]; then
        docker rmi $DANGLING_IMAGES
        echo "   ✅ Removed dangling images"
    else
        echo "   ℹ️  No dangling images to remove"
    fi

    # Remove unused images
    docker image prune -f
    echo "   ✅ Removed unused images"
fi

# Clean up volumes
if [ "$VOLUMES" = true ]; then
    echo "💾 Removing unused volumes..."

    # Remove recipe-specific volumes
    RECIPE_VOLUMES=$(docker volume ls -q --filter "name=recipe" 2>/dev/null || true)
    if [ -n "$RECIPE_VOLUMES" ]; then
        docker volume rm $RECIPE_VOLUMES 2>/dev/null || true
        echo "   ✅ Removed Cody Richter Cooks application volumes"
    fi

    # Remove unused volumes
    docker volume prune -f
    echo "   ✅ Removed unused volumes"
fi

# Clean up networks
if [ "$NETWORKS" = true ]; then
    echo "🌐 Removing unused networks..."

    # Remove recipe-specific network
    docker network rm recipe-network 2>/dev/null || true

    # Remove unused networks
    docker network prune -f
    echo "   ✅ Removed unused networks"
fi

# System-wide cleanup
echo "🔧 Running system-wide cleanup..."
docker system prune -f

# Show remaining resources
echo ""
echo "📊 Remaining Docker resources:"
echo "   Containers: $(docker ps -aq | wc -l)"
echo "   Images:     $(docker images -q | wc -l)"
echo "   Volumes:    $(docker volume ls -q | wc -l)"
echo "   Networks:   $(docker network ls -q | wc -l)"

# Show Disk space saved
echo ""
echo "💾 Docker disk usage:"
docker system df

echo ""
echo "✅ Cleanup completed successfully"
echo ""
echo "💡 To start fresh:"
echo "   ./scripts/local/build.sh --force"
echo "   ./scripts/local/start.sh"
