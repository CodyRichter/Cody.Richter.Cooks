# AGENTS.md (Scripts)

> [!IMPORTANT]
> The scripts in this directory are the **AUTHORITATIVE** way to manage the development lifecycle.
> AI Agents MUST prefer these scripts over raw commands to ensure consistent environments.

## 1. Local Development (`scripts/local/`)
| Script | Description |
| :--- | :--- |
| **`./scripts/local/start.sh`** | **Boot the system**. Starts Postgres and Backend containers. |
| **`./scripts/local/stop.sh`** | **Shutdown**. Stops containers. Use `--cleanup` to remove containers, `--volumes` to wipe data. |
| **`./scripts/local/build.sh`** | **Rebuild**. Re-runs `docker build`. Required after changing dependencies. |
| **`./scripts/local/migrate.sh`** | **Apply Local Migrations**. Runs migrations against the local database. |
| **`./scripts/local/migrate-create.sh "msg"`** | **New Migration**. Generates a new migration version file. |
| **`./scripts/local/test.sh`** | **Run Tests**. Runs pytest inside the container. |
| **`./scripts/local/cleanup.sh`** | **Reset**. Removes Docker artifacts to fix erratic states. |
| **`./scripts/local/setup-hooks.sh`** | **Git Hooks**. Installs and configures pre-commit hooks. |
| **`./scripts/local/create-test-recipes.sh`** | **Seed Data**. Populates the local database with test recipes. |

## 2. Production & Deployment (`scripts/prod/`)
| Script | Description |
| :--- | :--- |
| **`./scripts/prod/deploy.sh`** | **Deploy to Cloud Run**. Builds and pushes image, then deploys. |
| **`./scripts/prod/migrate.sh`** | **Apply Production Migrations**. Runs migrations against remote DB. **USE WITH CAUTION**. |
| **`./scripts/prod/setup-gcp.sh`** | **GCP Initialization**. Sets up project, APIs, and basic infra. |
| **`./scripts/prod/setup-secret-permissions.sh`** | **IAM Secrets**. Configures Secret Manager access for the service account. |
| **`./scripts/prod/logs.sh`** | **Production Logs**. View or tail live logs from GCP Cloud Run. |

## 3. Usage Rules
1.  **Safety First**: Never use `scripts/prod/` scripts unless you are explicitly performing deployment or production maintenance.
2.  **Context**: Scripts are designed to be run from the project root.
    - Correct: `./scripts/local/test.sh`
    - Incorrect: `cd scripts/local && ./test.sh`
3.  **Verification**: Always verify script exit codes (should be 0).
