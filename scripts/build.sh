#!/bin/bash

# Docker Build Script
# Builds all Docker images for the application

set -e

echo "🔨 Building Cody Richter Cooks Application Images..."

# Parse command line arguments
FORCE_REBUILD=false
NO_CACHE=false
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_REBUILD=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force      Force rebuild of all images"
            echo "  --no-cache   Build without using Docker cache"
            echo "  --service    Build specific service (backend, frontend)"
            echo "  --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Build all services"
            echo "  $0 --force           # Force rebuild all services"
            echo "  $0 --service backend # Build only backend service"
            echo "  $0 --no-cache        # Build without cache"
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build options
BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="$BUILD_ARGS --no-cache"
fi

if [ "$FORCE_REBUILD" = true ]; then
    BUILD_ARGS="$BUILD_ARGS --force-recreate"
fi

# Build specific service or all services
if [ -n "$SERVICE" ]; then
    case $SERVICE in
        backend|frontend|database)
            echo "🔧 Building $SERVICE service..."
            docker-compose build $BUILD_ARGS $SERVICE
            ;;
        *)
            echo "❌ Error: Unknown service '$SERVICE'"
            echo "   Available services: backend, frontend, database"
            exit 1
            ;;
    esac
else
    echo "🔧 Building all services..."
    docker-compose build $BUILD_ARGS
fi

# Show built images
echo ""
echo "📦 Built images:"
docker images | grep -E "(recipe-|postgres)" | head -10

# Check for dangling images
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    echo ""
    echo "🧹 Found dangling images. Clean them up with:"
    echo "   ./scripts/cleanup.sh --images"
fi

echo ""
echo "✅ Build completed successfully"
echo ""
echo "💡 Next steps:"
echo "   - Start development environment: ./scripts/dev-start.sh"
echo "   - Run cleanup if needed: ./scripts/cleanup.sh"