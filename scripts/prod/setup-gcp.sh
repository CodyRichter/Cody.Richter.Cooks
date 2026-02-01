#!/bin/bash
# =============================================================================
# setup-gcp.sh - One-time GCP project setup for Cloud Run deployment
# =============================================================================
# Usage: ./scripts/setup-gcp.sh [OPTIONS]
#
# Options:
#   --project PROJECT   GCP project ID (required)
#   --help              Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./scripts/setup-gcp.sh --project PROJECT_ID"
            echo ""
            echo "One-time setup for Google Cloud Run deployment."
            echo "This script enables required APIs and configures the project."
            echo ""
            echo "Options:"
            echo "  --project PROJECT   GCP project ID (required)"
            echo "  --help              Show this help message"
            echo ""
            echo "Prerequisites:"
            echo "  1. Google Cloud account with billing enabled"
            echo "  2. gcloud CLI installed and authenticated"
            echo ""
            echo "Example:"
            echo "  ./scripts/setup-gcp.sh --project my-cooking-app"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Functions
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Validate prerequisites
validate() {
    print_step "Validating prerequisites..."

    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed."
        echo ""
        echo "  Install from: https://cloud.google.com/sdk/docs/install"
        echo ""
        exit 1
    fi
    print_success "gcloud CLI found"

    # Check project specified
    if [[ -z "$PROJECT" ]]; then
        print_error "Project ID is required."
        echo "  Usage: ./scripts/setup-gcp.sh --project PROJECT_ID"
        exit 1
    fi

    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n 1 | grep -q .; then
        print_error "Not authenticated with gcloud."
        echo "  Run: gcloud auth login"
        exit 1
    fi
    print_success "gcloud authenticated"

    # Check project exists and accessible
    if ! gcloud projects describe "$PROJECT" &> /dev/null; then
        print_error "Project '$PROJECT' not found or not accessible."
        echo "  Create a project at: https://console.cloud.google.com/projectcreate"
        exit 1
    fi
    print_success "Project '$PROJECT' accessible"
}

# Enable required APIs
enable_apis() {
    print_step "Enabling required Google Cloud APIs..."

    APIS=(
        "run.googleapis.com"              # Cloud Run
        "cloudbuild.googleapis.com"       # Cloud Build
        "containerregistry.googleapis.com" # Container Registry
        "secretmanager.googleapis.com"    # Secret Manager (optional but recommended)
    )

    for api in "${APIS[@]}"; do
        echo "  Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT" --quiet
    done

    print_success "All APIs enabled"
}

# Set default project
configure_project() {
    print_step "Configuring gcloud defaults..."

    gcloud config set project "$PROJECT"
    print_success "Default project set to: $PROJECT"
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  GCP Project Setup Complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Next steps:"
    echo ""
    echo "  1. Deploy your backend:"
    echo "     ./scripts/prod/deploy.sh"
    echo ""
    echo "  2. After deployment, set environment variables in Cloud Run Console:"
    echo "     https://console.cloud.google.com/run?project=$PROJECT"
    echo ""
    echo "     Required variables:"
    echo "     - DATABASE_URL: Your Supabase PostgreSQL connection string"
    echo "     - SECRET_KEY: JWT secret (run: python -c \"import secrets; print(secrets.token_hex(32))\")"
    echo "     - CORS_ORIGINS: JSON array of allowed origins"
    echo ""
    echo "  3. (Optional) Use Secret Manager for sensitive values:"
    echo "     gcloud secrets create database-url --data-file=- <<< \"your-database-url\""
    echo "     gcloud secrets create jwt-secret-key --data-file=- <<< \"your-secret-key\""
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           GCP Setup - Cody Richter Cooks                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    validate
    echo ""
    enable_apis
    echo ""
    configure_project
    print_next_steps
}

main
