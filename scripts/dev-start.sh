#!/bin/bash

# Development Environment Startup Script
# Starts the complete development environment using Docker Compose

set -e

echo "🚀 Starting Cody Richter Cooks Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services with development overrides
echo "📦 Building and starting services..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo "🔍 Checking service status..."

# Check database health
if docker-compose ps database | grep -q "healthy"; then
    echo "✅ Database service is healthy"
else
    echo "⚠️  Database service may still be starting..."
fi

# Check backend health
if docker-compose ps backend | grep -q "Up"; then
    echo "✅ Backend service is running"
else
    echo "❌ Backend service failed to start"
    docker-compose logs backend
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "   Backend:  http://localhost:8000"
echo "   Database: localhost:5432"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f [service]"
echo "   Stop services: ./scripts/dev-stop.sh"
echo "   Run migration: ./scripts/migrate.sh"
echo ""