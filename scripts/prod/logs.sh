#!/bin/bash
# =============================================================================
# logs.sh - View or tail production logs from Google Cloud Run
# =============================================================================
# Usage: ./scripts/prod/logs.sh [OPTIONS]
#
# Options:
#   -f, --follow, --tail  Stream/tail live logs in real time
#   -n, --limit LIMIT     Number of recent log entries to show (default: 50)
#   --service SERVICE     Cloud Run service name (default: cooking-backend)
#   --region REGION       Cloud Run region (default: us-central1)
#   --project PROJECT     GCP project ID (required if not set via gcloud config)
#   --help, -h            Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVICE="cooking-backend"
REGION="us-central1"
PROJECT=""
FOLLOW=false
LIMIT=50

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow|--tail)
            FOLLOW=true
            shift
            ;;
        -n|--limit)
            LIMIT="$2"
            shift 2
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./scripts/prod/logs.sh [OPTIONS]"
            echo ""
            echo "View or tail production logs from Google Cloud Run."
            echo ""
            echo "Options:"
            echo "  -f, --follow, --tail  Stream/tail live logs in real time"
            echo "  -n, --limit LIMIT     Number of recent log entries to show (default: 50)"
            echo "  --service SERVICE     Cloud Run service name (default: cooking-backend)"
            echo "  --region REGION       Cloud Run region (default: us-central1)"
            echo "  --project PROJECT     GCP project ID (required if not set via gcloud config)"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/prod/logs.sh                   # View last 50 log entries"
            echo "  ./scripts/prod/logs.sh -f                # Stream logs in real-time"
            echo "  ./scripts/prod/logs.sh --limit 100       # View last 100 log entries"
            echo "  ./scripts/prod/logs.sh -f --project my-p # Stream logs from specific project"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage instructions."
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
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n 1 | grep -q .; then
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

# Stream or read logs
fetch_logs() {
    echo ""
    echo "  Service: $SERVICE"
    echo "  Region:  $REGION"
    echo "  Project: $PROJECT"
    echo ""

    if [[ "$FOLLOW" == "true" ]]; then
        print_step "Streaming live logs for '$SERVICE' (Ctrl+C to stop)..."
        echo ""
        if gcloud run services logs --help 2>&1 | grep -q "tail"; then
            exec gcloud run services logs tail "$SERVICE" --region="$REGION" --project="$PROJECT"
        else
            exec gcloud beta run services logs tail "$SERVICE" --region="$REGION" --project="$PROJECT"
        fi
    else
        print_step "Fetching last $LIMIT log entries for '$SERVICE'..."
        echo ""
        gcloud run services logs read "$SERVICE" \
            --region="$REGION" \
            --project="$PROJECT" \
            --limit="$LIMIT"
    fi
}

main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Cloud Run Logs - Cody Richter Cooks              ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    fetch_logs
}

main
