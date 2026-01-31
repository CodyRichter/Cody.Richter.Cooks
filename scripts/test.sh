#!/bin/bash

# Test runner script for backend tests
# Uses pytest markers for test selection instead of file name matching

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose files exist
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    exit 1
fi

if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml not found in current directory"
    exit 1
fi

# Default values
TEST_MARKER=""
VERBOSE=false
COVERAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_MARKER="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -t, --type TYPE     Test type to run (all, unit, integration, auth, api, database, security, performance)"
            echo "  -v, --verbose       Run tests in verbose mode"
            echo "  -c, --coverage      Run tests with coverage report"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Test Types (pytest markers):"
            echo "  all                 Run all tests (default)"
            echo "  unit                Run unit tests only"
            echo "  integration         Run integration tests only"
            echo "  auth                Run authentication tests"
            echo "  api                 Run API endpoint tests"
            echo "  database            Run database tests"
            echo "  security            Run security tests"
            echo "  performance         Run performance tests"
            echo ""
            echo "Examples:"
            echo "  $0                  # Run all tests"
            echo "  $0 -t unit          # Run only unit tests"
            echo "  $0 -t api -v        # Run API tests in verbose mode"
            echo "  $0 -t security      # Run security tests"
            echo "  $0 -c               # Run all tests with coverage"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Validate test marker
VALID_MARKERS=("all" "unit" "integration" "auth" "api" "database" "security" "performance")
if [ -n "$TEST_MARKER" ] && [[ ! " ${VALID_MARKERS[@]} " =~ " ${TEST_MARKER} " ]]; then
    print_error "Invalid test type: $TEST_MARKER"
    echo "Valid types: ${VALID_MARKERS[*]}"
    exit 1
fi

# Default to all tests if no marker specified
if [ -z "$TEST_MARKER" ]; then
    TEST_MARKER="all"
fi

print_status "Starting backend tests..."

# Build pytest command
PYTEST_CMD="pytest"

# Add verbose flag if requested
if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v"
fi

# Add coverage if requested
if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term"
fi

# Add marker selection
if [ "$TEST_MARKER" != "all" ]; then
    PYTEST_CMD="$PYTEST_CMD -m $TEST_MARKER"
    print_status "Running tests with marker: $TEST_MARKER"
else
    PYTEST_CMD="$PYTEST_CMD tests/"
    print_status "Running all tests"
fi

# Check if backend container is running
if ! docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps backend | grep -q "Up"; then
    print_warning "Backend container is not running. Starting development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

    # Wait for services to be ready with timeout
    print_status "Waiting for services to be ready..."
    MAX_WAIT=60
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        if docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps backend | grep -q "Up"; then
            break
        fi
        sleep 2
        WAITED=$((WAITED + 2))
    done

    if [ $WAITED -ge $MAX_WAIT ]; then
        print_error "Timeout waiting for backend container to start"
        exit 1
    fi

    # Additional wait for database initialization
    sleep 5

    # Check if database is ready
    print_status "Checking database connection..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T backend python -c "
from app.core.database import check_database_connection
import sys
if not check_database_connection():
    print('Database connection failed')
    sys.exit(1)
print('Database connection successful')
" || {
        print_error "Database connection failed. Please check your setup."
        exit 1
    }
fi

# Run tests in the backend container
print_status "Executing tests..."
if docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T backend bash -c "cd /app && $PYTEST_CMD"; then
    print_status "Tests completed successfully!"

    # If coverage was requested, show where to find the report
    if [ "$COVERAGE" = true ]; then
        print_status "Coverage report generated:"
        print_status "  - HTML report: backend/htmlcov/index.html"
        print_status "  - Terminal report: shown above"
    fi
    exit 0
else
    print_error "Tests failed!"
    exit 1
fi
