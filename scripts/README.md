# Development & Operations Scripts

This directory contains shell scripts for automating local development, testing, database migrations, and production deployment operations with Docker and Google Cloud.

> [!IMPORTANT]
> All scripts should be executed from the **repository root directory** (e.g., `./scripts/local/start.sh` or `./scripts/prod/deploy.sh`).

---

## Directory Structure

```
scripts/
├── local/                          # Local development scripts
│   ├── build.sh                   # Build Docker images
│   ├── cleanup.sh                 # Prune Docker containers/images/volumes
│   ├── create-test-recipes.sh     # Seed mock recipes into local DB
│   ├── migrate-create.sh          # Generate Alembic migration file
│   ├── migrate.sh                 # Apply migrations to local DB
│   ├── setup-hooks.sh             # Configure git pre-commit hooks
│   ├── start.sh                   # Start local Docker services
│   ├── stop.sh                    # Stop local Docker services
│   └── test.sh                    # Run backend pytest suite
└── prod/                           # Production & GCP deployment scripts
    ├── deploy.sh                  # Build and deploy backend to Cloud Run
    ├── logs.sh                    # Stream or fetch Cloud Run logs
    ├── migrate.sh                 # Run Alembic migrations against remote DB
    ├── setup-gcp.sh               # One-time GCP project initialization
    └── setup-secret-permissions.sh# Grant Secret Manager IAM permissions
```

---

## 1. Local Development (`scripts/local/`)

### `start.sh`
Starts the complete development environment (PostgreSQL + FastAPI backend) using Docker Compose with development overrides.

```bash
./scripts/local/start.sh
```

**Features:**
- Verifies Docker daemon status
- Builds and starts containers with hot-reloading (`docker-compose.dev.yml`)
- Waits for PostgreSQL database health checks before completing
- Displays active service URLs

---

### `stop.sh`
Stops the development environment with optional cleanup.

```bash
./scripts/local/stop.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `--cleanup` | Remove stopped containers after stopping |
| `--volumes` | Remove volumes (⚠️ **WARNING**: Deletes database data) |
| `--help` | Show help message |

**Examples:**
```bash
./scripts/local/stop.sh                    # Stop services only
./scripts/local/stop.sh --cleanup          # Stop and remove containers
./scripts/local/stop.sh --cleanup --volumes# Stop, remove containers, and wipe database volume
```

---

### `build.sh`
Builds Docker images for all services or a specific service.

```bash
./scripts/local/build.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `--force` | Force recreate and rebuild images |
| `--no-cache` | Build images without using Docker cache |
| `--service SERVICE` | Build specific service (`backend`, `database`) |
| `--help` | Show help message |

**Examples:**
```bash
./scripts/local/build.sh                    # Build all services
./scripts/local/build.sh --force           # Force rebuild all services
./scripts/local/build.sh --service backend # Build only the backend image
./scripts/local/build.sh --no-cache        # Clean build without cache
```

---

### `migrate.sh`
Applies pending Alembic database migrations to the **local** Docker database.

```bash
./scripts/local/migrate.sh
```

**Features:**
- Verifies database container health before running migrations
- Safety check prevents accidentally targeting remote databases
- Runs `alembic upgrade head` inside the container

---

### `migrate-create.sh`
Auto-generates a new Alembic migration version file based on SQLAlchemy model changes.

```bash
./scripts/local/migrate-create.sh "Migration description"
```

**Examples:**
```bash
./scripts/local/migrate-create.sh "Add user table"
./scripts/local/migrate-create.sh "Add recipe and ingredient models"
./scripts/local/migrate-create.sh "Add indexes for recipe search"
```

---

### `test.sh`
Runs backend `pytest` tests inside the backend container with support for test filtering, verbosity, and coverage reports.

```bash
./scripts/local/test.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `-t, --type TYPE` | Test marker to run (`all`, `unit`, `integration`, `auth`, `api`, `database`, `security`, `performance`) |
| `-v, --verbose` | Run pytest with verbose output |
| `-c, --coverage` | Generate HTML and terminal test coverage reports |
| `-h, --help` | Show help message |

**Examples:**
```bash
./scripts/local/test.sh                  # Run all tests
./scripts/local/test.sh -t unit          # Run only unit tests
./scripts/local/test.sh -t api -v        # Run API tests in verbose mode
./scripts/local/test.sh -t security      # Run security & audit tests
./scripts/local/test.sh -c               # Run tests with HTML coverage report
```

---

### `cleanup.sh`
Cleans up Docker resources (containers, images, volumes, networks).

```bash
./scripts/local/cleanup.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `--containers` | Remove stopped containers |
| `--images` | Remove dangling and unused images |
| `--volumes` | Remove unused volumes (⚠️ Data loss) |
| `--networks` | Remove unused networks |
| `--all` | Clean up everything |
| `--force` | Skip confirmation prompts |
| `--help` | Show help message |

**Examples:**
```bash
./scripts/local/cleanup.sh                  # Basic cleanup (stopped containers + dangling images)
./scripts/local/cleanup.sh --all           # Complete cleanup
./scripts/local/cleanup.sh --all --force   # Complete cleanup without prompts
./scripts/local/cleanup.sh --volumes       # Remove database volumes
```

---

### `setup-hooks.sh`
Installs and configures Git pre-commit hooks using `pre-commit` and `ruff`.

```bash
./scripts/local/setup-hooks.sh
```

**Features:**
- Auto-detects and installs `pre-commit` via Homebrew, pipx, or pip
- Installs repository git hooks defined in `.pre-commit-config.yaml`

---

### `create-test-recipes.sh`
Populates the local database with 20 sample recipes across various categories via the API.

```bash
./scripts/local/create-test-recipes.sh
```

**Prerequisites:** Backend must be running at `http://localhost:8000`.

---

## 2. Production & GCP Operations (`scripts/prod/`)

> [!CAUTION]
> Production scripts interact with live Google Cloud and remote database infrastructure. Use with caution.

### `deploy.sh`
Builds and deploys the backend container to Google Cloud Run using Cloud Build.

```bash
./scripts/prod/deploy.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `--project PROJECT` | GCP project ID (defaults to active `gcloud config` project) |
| `--region REGION` | Cloud Run region (default: `us-central1`) |
| `--dry-run` | Preview the deployment without submitting build |
| `--help` | Show help message |

**Examples:**
```bash
./scripts/prod/deploy.sh --project my-gcp-project
./scripts/prod/deploy.sh --project my-gcp-project --region us-west1
./scripts/prod/deploy.sh --dry-run
```

---

### `logs.sh`
Fetches or streams live production logs from Google Cloud Run.

```bash
./scripts/prod/logs.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `-f, --follow, --tail` | Stream/tail live logs in real time |
| `-n, --limit LIMIT` | Number of recent log entries to display (default: 50) |
| `--service SERVICE` | Cloud Run service name (default: `cooking-backend`) |
| `--region REGION` | Cloud Run region (default: `us-central1`) |
| `--project PROJECT` | GCP project ID |
| `--help, -h` | Show help message |

**Examples:**
```bash
./scripts/prod/logs.sh                   # View last 50 log entries
./scripts/prod/logs.sh -f                # Stream logs in real-time
./scripts/prod/logs.sh --limit 100       # View last 100 log entries
./scripts/prod/logs.sh -f --project my-p # Stream logs from specific project
```

---

### `migrate.sh`
Applies Alembic migrations to a **remote/production** database.

```bash
./scripts/prod/migrate.sh [DATABASE_URL]
```

**Options / Environment:**
- Pass the connection string as the first argument:
  ```bash
  ./scripts/prod/migrate.sh "postgresql://user:pass@host:port/dbname"
  ```
- Or set the `POSTGRES_URL` or `DATABASE_URL` environment variable:
  ```bash
  export POSTGRES_URL="postgresql://user:pass@host:port/dbname"
  ./scripts/prod/migrate.sh
  ```

**Features:**
- Supports both `postgresql://` and `postgres://` connection schemes
- Prompts for confirmation if the target URL appears to be a local database

---

### `setup-gcp.sh`
One-time GCP project initialization for Cloud Run deployment.

```bash
./scripts/prod/setup-gcp.sh --project PROJECT_ID
```

**Features:**
- Enables required Google Cloud APIs (`run.googleapis.com`, `cloudbuild.googleapis.com`, `containerregistry.googleapis.com`, `secretmanager.googleapis.com`)
- Sets active `gcloud` project defaults

---

### `setup-secret-permissions.sh`
Configures IAM access permissions for Secret Manager secrets required by Cloud Run.

```bash
./scripts/prod/setup-secret-permissions.sh [OPTIONS]
```

**Options:**
| Option | Description |
| :--- | :--- |
| `--project PROJECT` | GCP project ID |
| `--service-account EMAIL` | Cloud Run service account email (auto-detected by default) |
| `--help` | Show help message |

**Secrets Managed:**
- `SECRET_KEY`
- `DATABASE_URL`
- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`

---

## 3. Secret Key Generation

To generate a secure 256-bit hexadecimal key for `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
