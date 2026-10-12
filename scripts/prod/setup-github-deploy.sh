#!/bin/bash
# =============================================================================
# setup-github-deploy.sh - One-time setup for .github/workflows/deploy-backend.yml
# =============================================================================
# Lets GitHub Actions deploy via Workload Identity Federation (no JSON keys):
#   1. Creates a `github-deployer` service account with the roles needed to run
#      infrastructure/cloudrun/cloudbuild.yaml
#   2. Creates a workload identity pool/provider trusting only this repository
#   3. Stores the resulting identifiers as GitHub repository variables (via gh)
#
# Usage: ./scripts/prod/setup-github-deploy.sh --project PROJECT_ID [--repo OWNER/REPO]
# Safe to re-run: existing resources are reused.
# =============================================================================

set -euo pipefail

PROJECT=""
REPO="CodyRichter/Cody.Richter.Cooks"
POOL="github"
PROVIDER="github-actions"
SA_NAME="github-deployer"

while [[ $# -gt 0 ]]; do
    case $1 in
        --project) PROJECT="$2"; shift 2 ;;
        --repo) REPO="$2"; shift 2 ;;
        --help|-h)
            sed -n '2,13p' "$0"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [[ -z "$PROJECT" ]]; then
    echo "--project is required"
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
BUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "▶ Enabling APIs..."
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com \
    cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com \
    --project="$PROJECT"

echo "▶ Creating deployer service account..."
gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT" >/dev/null 2>&1 ||
    gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT" \
        --display-name="GitHub Actions backend deployer"

# Submit Cloud Build jobs (uploads source to the _cloudbuild bucket), stream
# their logs, and read the service URL for the smoke test.
for role in roles/cloudbuild.builds.editor roles/storage.admin roles/logging.viewer \
    roles/serviceusage.serviceUsageConsumer roles/run.viewer; do
    gcloud projects add-iam-policy-binding "$PROJECT" --quiet --condition=None \
        --member="serviceAccount:${SA_EMAIL}" --role="$role" >/dev/null
done

# Cloud Build runs as the default compute service account: it deploys the
# service, deploys/executes the migration job, and the job reads secrets.
echo "▶ Granting Cloud Build service account (${BUILD_SA}) deploy roles..."
for role in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer \
    roles/secretmanager.secretAccessor roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "$PROJECT" --quiet --condition=None \
        --member="serviceAccount:${BUILD_SA}" --role="$role" >/dev/null
done

# Every deploy pushes a SHA-tagged image; keep only the 4 newest for rollback.
echo "▶ Applying Artifact Registry cleanup policy..."
gcloud artifacts repositories set-cleanup-policies gcr.io --project="$PROJECT" --location=us \
    --policy="$(dirname "$0")/../../infrastructure/cloudrun/artifact-cleanup-policy.json" \
    --no-dry-run >/dev/null

echo "▶ Creating workload identity pool and provider..."
gcloud iam workload-identity-pools describe "$POOL" --location=global --project="$PROJECT" >/dev/null 2>&1 ||
    gcloud iam workload-identity-pools create "$POOL" --location=global --project="$PROJECT" \
        --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers describe "$PROVIDER" --workload-identity-pool="$POOL" \
    --location=global --project="$PROJECT" >/dev/null 2>&1 ||
    gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
        --workload-identity-pool="$POOL" --location=global --project="$PROJECT" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
        --attribute-condition="assertion.repository == '${REPO}'"

POOL_ID="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --project="$PROJECT" --quiet \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${REPO}" >/dev/null

PROVIDER_ID="${POOL_ID}/providers/${PROVIDER}"

echo "▶ Setting GitHub repository variables and 'production' environment..."
if command -v gh >/dev/null 2>&1; then
    gh variable set GCP_PROJECT_ID --repo "$REPO" --body "$PROJECT"
    gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "$REPO" --body "$PROVIDER_ID"
    gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo "$REPO" --body "$SA_EMAIL"
    gh api --method PUT "repos/${REPO}/environments/production" >/dev/null
else
    echo "gh CLI not found. Set these repository variables manually:"
    echo "  GCP_PROJECT_ID=$PROJECT"
    echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=$PROVIDER_ID"
    echo "  GCP_DEPLOY_SERVICE_ACCOUNT=$SA_EMAIL"
    echo "and create a 'production' environment in the repository settings."
fi

echo "✓ Done. Pushes to master now deploy the backend after CI passes."
