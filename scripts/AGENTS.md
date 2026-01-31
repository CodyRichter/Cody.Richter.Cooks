# AGENTS.md (Scripts)

> [!IMPORTANT]
> The scripts in this directory are the **AUTHORITATIVE** way to manage the development lifecycle.
> AI Agents MUST prefer these scripts over raw commands to ensure consistent environments.

## 1. Local Development (`scripts/local/`)
| Script | Description |
| :--- | :--- |
| **`./start.sh`** | **Boot the system**. Starts Postgres and Backend containers. |
| **`./stop.sh`** | **Shutdown**. Stops containers. Use `--cleanup` to remove containers, `--volumes` to wipe data. |
| **`./build.sh`** | **Rebuild**. Re-runs `docker build`. Required after changing dependencies. |
| **`./migrate.sh`** | **Apply Local Migrations**. Runs migrations against the local database. |
| **`./migrate-create.sh "msg"`** | **New Migration**. Generates a new migration version file. |
| **`./test.sh`** | **Run Tests**. Runs pytest inside the container. |
| **`./cleanup.sh`** | **Reset**. Removes Docker artifacts to fix erratic states. |
| **`./create-test-recipes.sh`** | **Seed Data**. Populates the local database with test recipes. |

## 2. Production & Deployment (`scripts/prod/`)
| Script | Description |
| :--- | :--- |
| **`./deploy.sh`** | **Deploy to Cloud Run**. Builds and pushes image, then deploys. |
| **`./migrate.sh`** | **Apply Production Migrations**. Runs migrations against remote DB. **USE WITH CAUTION**. |
| **`./setup-gcp.sh`** | **GCP Initialization**. Sets up project, APIs, and basic infra. |
| **`./setup-secret-permissions.sh`** | **IAM Secrets**. Configures Secret Manager access for the service account. |

## 3. Usage Rules
1.  **Safety First**: Never use `scripts/prod/` scripts unless you are explicitly performing deployment or production maintenance.
2.  **Context**: Scripts are designed to be run from the project root.
    - Correct: `bash scripts/local/test.sh`
    - Incorrect: `cd scripts/local && ./test.sh`
3.  **Verification**: Always verify script exit codes (should be 0).
