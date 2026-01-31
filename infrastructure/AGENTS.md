# AGENTS.md (Infrastructure)

> [!NOTE]
> This document guides AI agents on managing and modifying the infrastructure for the "CookingV2" project.

## 1. Tech Stack Overview
- **Deployment Platform**: [Google Cloud Run](https://cloud.google.com/run) (Serverless container execution)
- **CI/CD**: [Google Cloud Build](https://cloud.google.com/build)
- **Database**: [Supabase](https://supabase.com/) (Managed PostgreSQL)
- **Containerization**: Docker & Docker Compose

## 2. Directory Structure
- `cloudrun/`: Configuration for Cloud Run services and build triggers.
  - `service.yaml`: Cloud Run service definition (Specifies CPU, Memory, Concurrency).
  - `cloudbuild.yaml`: Build pipeline definition.
- `postgres/`: Database initialization scripts and local development setup.
  - `init.sql`: Schema initialization for local development.

## 3. Cost-Optimization Rules
For a project with 200-300 requests/day, we MUST maintain a minimal footprint:
1. **Scale to Zero**: Always ensure `autoscaling.knative.dev/minScale: "0"` is set in `service.yaml` unless otherwise specified.
2. **Resource Allocation**: Start with minimal CPU and memory (e.g., 512MiB memory, 1 CPU). Only increase if performance bottlenecks are identified.
3. **Concurrency**: Tune `containerConcurrency` to handle multiple requests per instance (default 80 is usually fine for FastAPI).

## 4. Security & Secret Management
**UTMOST CONCERN**: No credentials or secret keys should EVER be pushed to the repository.

1. **Environment Variables**: Use `.env` files for local development (ensure they are in `.gitignore`).

2. **Cloud Run Secret Manager Integration** (CURRENT SETUP):
   - **Secrets Used**: `SECRET_KEY` and `DATABASE_URL` are stored in Google Cloud Secret Manager
   - **Automatic Mounting**: Cloud Run automatically mounts these secrets as environment variables
   - **Backend Agnostic**: The application code reads from standard env vars with no cloud-specific logic

3. **One-Time Setup** (Already Configured):
   ```bash
   # Grant Secret Manager permissions to Cloud Run service account
   ./scripts/setup-secret-permissions.sh --project PROJECT_ID
   ```

4. **IAM Roles & Public Access**:
   - Service account requires `roles/secretmanager.secretAccessor` for each secret
   - **Public Access (Fix for "Forbidden" error)**: Add the `allUsers` principal with the `Cloud Run Invoker` role in GCP Console

## 5. Development Workflow
- **Local Dev**: Use `docker-compose.yml` in the root directory for a consistent environment.
- **Deploying**: Prefer `scripts/deploy-cloudrun.sh` for production deployments.
- **Verification**: Always check logs in Google Cloud Console after deploying changes to infrastructure.
