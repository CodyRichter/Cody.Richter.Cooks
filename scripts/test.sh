#!/bin/bash

# Test runner script for backend tests
# This script follows the pattern established by other scripts in this directory

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

# Default values
TEST_TYPE="all"
VERBOSE=false
COVERAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
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
            echo "  -t, --type TYPE     Test type to run (all, unit, integration, auth, models, api, database, security)"
            echo "  -v, --verbose       Run tests in verbose mode"
            echo "  -c, --coverage      Run tests with coverage report"
            echo "  -h, --help          Show this help message"
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
            exit 1
            ;;
    esac
done

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

# Get list of available test files
TEST_FILES=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T backend bash -c "ls /app/tests/test_*.py" | sed 's/.*test_//' | sed 's/\.py//')

if [ "$TEST_TYPE" = "all" ]; then
    PYTEST_CMD="$PYTEST_CMD tests/"
else
    # Convert test type to lowercase for comparison
    TEST_TYPE_LOWER=$(echo "$TEST_TYPE" | tr '[:upper:]' '[:lower:]')

    # Find matching test files
    MATCHING_FILES=""
    for file in $TEST_FILES; do
        if echo "$file" | tr '[:upper:]' '[:lower:]' | grep -q "$TEST_TYPE_LOWER"; then
            MATCHING_FILES="$MATCHING_FILES tests/test_$file.py"
        fi
    done

    if [ -z "$MATCHING_FILES" ]; then
        print_error "No test files found matching: $TEST_TYPE"
        print_error "Available test types: all, $(echo $TEST_FILES | tr ' ' ', ')"
        exit 1
    fi

    PYTEST_CMD="$PYTEST_CMD $MATCHING_FILES"
fi


print_status "Running test type: $TEST_TYPE"

# Check if backend container is running
if ! docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps backend | grep -q "Up"; then
    print_warning "Backend container is not running. Starting development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
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
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T backend bash -c "
    cd /app && $PYTEST_CMD
" || {
    print_error "Tests failed!"
    exit 1
}

print_status "Tests completed successfully!"

# If coverage was requested, show where to find the report
if [ "$COVERAGE" = true ]; then
    print_status "Coverage report generated:"
    print_status "  - HTML report: backend/htmlcov/index.html"
    print_status "  - Terminal report: shown above"
fi