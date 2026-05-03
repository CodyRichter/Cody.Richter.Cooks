#!/bin/bash
# =============================================================================
# setup-secret-permissions.sh - Configure Secret Manager IAM permissions
# =============================================================================
# Usage: ./scripts/setup-secret-permissions.sh [OPTIONS]
#
# Options:
#   --project PROJECT          GCP project ID (required if not set via gcloud config)
#   --service-account EMAIL    Service account email (default: auto-detect from project)
#   --help                     Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT=""
SERVICE_ACCOUNT=""
SECRETS=("SECRET_KEY" "DATABASE_URL" "RESEND_API_KEY" "TURNSTILE_SECRET_KEY")

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT="$2"
            shift 2
            ;;
        --service-account)
            SERVICE_ACCOUNT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./scripts/prod/setup-secret-permissions.sh [OPTIONS]"
            echo ""
            echo "Configure IAM permissions for Secret Manager secrets."
            echo ""
            echo "Options:"
            echo "  --project PROJECT          GCP project ID (required if not set via gcloud config)"
            echo "  --service-account EMAIL    Service account email (default: auto-detect)"
            echo "  --help                     Show this help message"
            echo ""
            echo "This script grants the 'roles/secretmanager.secretAccessor' role to"
            echo "the Cloud Run service account for the following secrets:"
            echo "  - SECRET_KEY"
            echo "  - DATABASE_URL"
            echo ""
            echo "Example:"
            echo "  ./scripts/prod/setup-secret-permissions.sh --project my-gcp-project"
            echo "  ./scripts/prod/setup-secret-permissions.sh --project my-gcp-project --service-account my-sa@project.iam.gserviceaccount.com"
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

    # Get or verify service account
    if [[ -z "$SERVICE_ACCOUNT" ]]; then
        # Extract project number from project ID
        PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format="value(projectNumber)" 2>/dev/null)
        if [[ -z "$PROJECT_NUMBER" ]]; then
            print_error "Could not determine project number."
            echo "  Use --service-account flag to specify the service account manually"
            exit 1
        fi
        SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
        print_success "Auto-detected service account: $SERVICE_ACCOUNT"
    else
        print_success "Using service account: $SERVICE_ACCOUNT"
    fi
}

# Verify secrets exist
verify_secrets() {
    print_step "Verifying secrets exist..."

    local all_exist=true
    for secret in "${SECRETS[@]}"; do
        if gcloud secrets describe "$secret" --project="$PROJECT" &> /dev/null; then
            print_success "Secret '$secret' exists"
        else
            print_error "Secret '$secret' does not exist"
            all_exist=false
        fi
    done

    if [[ "$all_exist" == "false" ]]; then
        echo ""
        print_error "Some secrets do not exist. Please create them first:"
        echo "  Example:"
        echo "    echo -n 'your-secret-value' | gcloud secrets create SECRET_KEY --data-file=- --project=$PROJECT"
        echo "    echo -n 'your-database-url' | gcloud secrets create DATABASE_URL --data-file=- --project=$PROJECT"
        exit 1
    fi
}

# Grant permissions
grant_permissions() {
    print_step "Granting Secret Manager permissions..."

    for secret in "${SECRETS[@]}"; do
        echo ""
        print_step "Configuring access for secret: $secret"

        # Check if permission already exists
        if gcloud secrets get-iam-policy "$secret" \
            --project="$PROJECT" \
            --flatten="bindings[].members" \
            --filter="bindings.role:roles/secretmanager.secretAccessor AND bindings.members:serviceAccount:$SERVICE_ACCOUNT" \
            --format="value(bindings.members)" 2>/dev/null | grep -q "$SERVICE_ACCOUNT"; then
            print_warning "Permission already exists for $secret"
        else
            # Grant the permission
            if gcloud secrets add-iam-policy-binding "$secret" \
                --member="serviceAccount:$SERVICE_ACCOUNT" \
                --role="roles/secretmanager.secretAccessor" \
                --project="$PROJECT" > /dev/null 2>&1; then
                print_success "Granted access to $secret"
            else
                print_error "Failed to grant access to $secret"
                exit 1
            fi
        fi
    done
}

# Display summary
display_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Secret Manager Permissions Configured Successfully!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Project: $PROJECT"
    echo "  Service Account: $SERVICE_ACCOUNT"
    echo "  Secrets configured:"
    for secret in "${SECRETS[@]}"; do
        echo "    - $secret"
    done
    echo ""
    echo "  Next steps:"
    echo "  1. Deploy your application: ./scripts/prod/deploy.sh --project $PROJECT"
    echo "  2. Verify secrets are loaded: Check Cloud Run logs after deployment"
    echo ""
    echo "  To verify permissions:"
    echo "    gcloud secrets get-iam-policy SECRET_KEY --project=$PROJECT"
    echo "    gcloud secrets get-iam-policy DATABASE_URL --project=$PROJECT"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║      Secret Manager IAM Setup - Cody Richter Cooks       ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    echo ""
    verify_secrets
    echo ""
    grant_permissions
    echo ""
    display_summary
}

main
