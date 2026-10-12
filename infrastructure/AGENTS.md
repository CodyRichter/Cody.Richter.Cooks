# AGENTS.md (Infrastructure)

> [!NOTE]
> This document guides AI agents on managing and modifying the infrastructure for the "CookingV2" project.

## 1. Tech Stack Overview
- **Deployment Platform**: [Google Cloud Run](https://cloud.google.com/run) (Serverless container execution)
- **CI/CD**: GitHub Actions (`.github/workflows/`) for checks; [Google Cloud Build](https://cloud.google.com/build) for the release pipeline
- **Database**: [Supabase](https://supabase.com/) (Managed PostgreSQL)
- **Containerization**: Docker & Docker Compose

## 2. Directory Structure
- `cloudrun/`: Cloud Run release configuration.
  - `cloudbuild.yaml`: The release pipeline and the source of truth for the service's runtime config (CPU, memory, scaling, env vars, secrets). Steps: build the image tagged with the git SHA, run `alembic upgrade head` as the `cooking-backend-migrate` Cloud Run Job (same image), then deploy the service.
- `postgres/`: Database initialization scripts and local development setup.
  - `init.sql`: Schema initialization for local development.

## 3. Cost-Optimization Rules
For a project with 200-300 requests/day, we MUST maintain a minimal footprint:
1. **Scale to Zero**: Keep `--min-instances 0` in `cloudbuild.yaml` unless otherwise specified.
2. **Resource Allocation**: Start with minimal CPU and memory (e.g., 512MiB memory, 1 CPU). Only increase if performance bottlenecks are identified.
3. **Concurrency**: Tune `containerConcurrency` to handle multiple requests per instance (default 80 is usually fine for FastAPI).

## 4. Security & Secret Management
**UTMOST CONCERN**: No credentials or secret keys should EVER be pushed to the repository.

1. **Environment Variables**: Use `.env` files for local development (ensure they are in `.gitignore`).

2. **Cloud Run Secret Manager Integration** (CURRENT SETUP):
   - **Secrets Used**: `SECRET_KEY`, `DATABASE_URL`, `RESEND_API_KEY`, and `TURNSTILE_SECRET_KEY` are stored in Google Cloud Secret Manager
   - **Automatic Mounting**: Cloud Run automatically mounts these secrets as environment variables
   - **Backend Agnostic**: The application code reads from standard env vars with no cloud-specific logic

3. **One-Time Setup** (Already Configured):
   ```bash
   # Grant Secret Manager permissions to Cloud Run service account
   ./scripts/prod/setup-secret-permissions.sh --project PROJECT_ID
   ```

4. **IAM Roles & Public Access**:
   - Service account requires `roles/secretmanager.secretAccessor` for each secret
   - **Public Access (Fix for "Forbidden" error)**: Add the `allUsers` principal with the `Cloud Run Invoker` role in GCP Console

## 5. Development Workflow
- **Local Dev**: Use `docker-compose.yml` in the root directory for a consistent environment.
- **Deploying**: Merging to `master` deploys automatically: `.github/workflows/ci.yml` (lint, tests on Postgres, frontend build) must pass, then `.github/workflows/deploy-backend.yml` submits `cloudbuild.yaml` with the commit SHA. `scripts/prod/deploy.sh` runs the same pipeline manually from a clean checkout.
- **Rollback**: Every image is tagged with its commit SHA (and the revision is labelled `git-sha`). Roll back with `gcloud run services update-traffic cooking-backend --to-revisions=REVISION=100 --region us-central1`, or re-run the deploy workflow on an older commit. Migrations are not reversed automatically.
- **One-time CI/CD setup**: `./scripts/prod/setup-github-deploy.sh --project codyrichtercooks` (Workload Identity Federation, deployer service account, GitHub repository variables, and the Artifact Registry cleanup policy in `cloudrun/artifact-cleanup-policy.json`, which keeps the 4 newest images and deletes the rest).
- **Verification**: Always check logs in Google Cloud Console after deploying changes to infrastructure.
