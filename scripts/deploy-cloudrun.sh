#!/bin/bash
# =============================================================================
# deploy-cloudrun.sh - Deploy backend to Google Cloud Run
# =============================================================================
# Usage: ./scripts/deploy-cloudrun.sh [OPTIONS]
#
# Options:
#   --project PROJECT   GCP project ID (required if not set via gcloud config)
#   --region REGION     Cloud Run region (default: us-central1)
#   --dry-run           Show what would be deployed without deploying
#   --help              Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
REGION="us-central1"
DRY_RUN=false
PROJECT=""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/deploy-cloudrun.sh [OPTIONS]"
            echo ""
            echo "Deploy the backend to Google Cloud Run."
            echo ""
            echo "Options:"
            echo "  --project PROJECT   GCP project ID (required if not set via gcloud config)"
            echo "  --region REGION     Cloud Run region (default: us-central1)"
            echo "  --dry-run           Show what would be deployed without deploying"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment Variables (must be set in Cloud Run):"
            echo "  DATABASE_URL        PostgreSQL connection string (Supabase)"
            echo "  SECRET_KEY          JWT secret key (256-bit hex)"
            echo "  CORS_ORIGINS        Allowed CORS origins (JSON array)"
            echo ""
            echo "Example:"
            echo "  ./scripts/deploy-cloudrun.sh --project my-gcp-project"
            echo "  ./scripts/deploy-cloudrun.sh --project my-gcp-project --region us-west1"
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

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed."
        echo "  Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI found"

    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 &> /dev/null; then
        print_error "Not authenticated with gcloud."
        echo "  Run: gcloud auth login"
        exit 1
    fi
    print_success "gcloud authenticated"

    # Get project ID
    if [[ -z "$PROJECT" ]]; then
        PROJECT=$(gcloud config get-value project 2>/dev/null)
        if [[ -z "$PROJECT" ]]; then
            print_error "No GCP project specified."
            echo "  Use --project flag or run: gcloud config set project PROJECT_ID"
            exit 1
        fi
    fi
    print_success "Using project: $PROJECT"
}

# Build and deploy
deploy() {
    print_step "Starting deployment to Cloud Run..."
    echo "  Project: $PROJECT"
    echo "  Region: $REGION"
    echo ""

    if [[ "$DRY_RUN" == "true" ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
        echo "Would execute:"
        echo "  gcloud builds submit --config=infrastructure/cloudrun/cloudbuild.yaml \\"
        echo "    --substitutions=_REGION=$REGION \\"
        echo "    --project=$PROJECT"
        return
    fi

    cd "$PROJECT_ROOT"

    # Submit build
    print_step "Submitting build to Cloud Build..."
    gcloud builds submit \
        --config=infrastructure/cloudrun/cloudbuild.yaml \
        --substitutions=_REGION="$REGION" \
        --project="$PROJECT"

    print_success "Deployment complete!"
    echo ""

    # Get service URL
    SERVICE_URL=$(gcloud run services describe cooking-backend \
        --region="$REGION" \
        --project="$PROJECT" \
        --format="value(status.url)" 2>/dev/null || echo "")

    if [[ -n "$SERVICE_URL" ]]; then
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Backend deployed successfully!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "  Service URL: $SERVICE_URL"
        echo "  Health Check: $SERVICE_URL/health"
        echo ""
        echo "  Next steps:"
        echo "  1. Set environment variables in Cloud Run Console:"
        echo "     - DATABASE_URL (your Supabase connection string)"
        echo "     - SECRET_KEY (generate with: python -c \"import secrets; print(secrets.token_hex(32))\")"
        echo "     - CORS_ORIGINS (e.g., [\"https://your-app.vercel.app\"])"
        echo ""
        echo "  2. Update your frontend's NEXT_PUBLIC_API_BASE_URL to: $SERVICE_URL"
        echo ""
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         Cloud Run Deployment - Cody Richter Cooks         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    echo ""
    deploy
}

main
