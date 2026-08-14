# Development Scripts

This directory contains shell scripts for automating common development operations with Docker.

## Scripts Overview

### `dev-start.sh`
Starts the complete development environment using Docker Compose.

```bash
./scripts/dev-start.sh
```

**Features:**
- Builds and starts all services (database, backend, frontend)
- Uses development overrides for hot-reloading
- Checks service health and provides status feedback
- Shows service URLs and useful commands

### `dev-stop.sh`
Stops the development environment with optional cleanup.

```bash
./scripts/dev-stop.sh [OPTIONS]
```

**Options:**
- `--cleanup`: Remove containers after stopping
- `--volumes`: Remove volumes (WARNING: Deletes database data)
- `--help`: Show help message

**Examples:**
```bash
./scripts/dev-stop.sh                    # Stop services only
./scripts/dev-stop.sh --cleanup          # Stop and remove containers
./scripts/dev-stop.sh --cleanup --volumes # Stop, remove containers and volumes
```

### `migrate.sh`
Runs Alembic database migrations through Docker.

```bash
./scripts/migrate.sh
```

**Features:**
- Checks database connectivity before running migrations
- Applies all pending migrations
- Shows current migration status
- Provides helpful error messages and troubleshooting tips

### `migrate-create.sh`
Creates new Alembic migration files through Docker.

```bash
./scripts/migrate-create.sh "Migration description"
```

**Examples:**
```bash
./scripts/migrate-create.sh "Add user table"
./scripts/migrate-create.sh "Add recipe and ingredient models"
./scripts/migrate-create.sh "Add indexes for recipe search"
```

**Features:**
- Auto-generates migration files based on model changes
- Validates database connectivity
- Shows generated migration files
- Provides next steps guidance

### `build.sh`
Builds Docker images for all or specific services.

```bash
./scripts/build.sh [OPTIONS]
```

**Options:**
- `--force`: Force rebuild of all images
- `--no-cache`: Build without using Docker cache
- `--service SERVICE`: Build specific service (backend, frontend)
- `--help`: Show help message

**Examples:**
```bash
./scripts/build.sh                    # Build all services
./scripts/build.sh --force           # Force rebuild all services
./scripts/build.sh --service backend # Build only backend service
./scripts/build.sh --no-cache        # Build without cache
```

### `test.sh`
Runs backend tests with various options and configurations.

```bash
./scripts/test.sh [OPTIONS]
```

**Options:**
- `-t, --type TYPE`: Test type (all, unit, integration, auth, models, api)
- `-v, --verbose`: Run tests in verbose mode
- `-c, --coverage`: Run tests with coverage report
- `-h, --help`: Show help message

**Examples:**
```bash
./scripts/test.sh                  # Run all tests
./scripts/test.sh -t unit          # Run only unit tests
./scripts/test.sh -t api -v        # Run API tests in verbose mode
./scripts/test.sh -c               # Run all tests with coverage
```

### `cleanup.sh`
Cleans up Docker resources (containers, images, volumes, networks).

```bash
./scripts/cleanup.sh [OPTIONS]
```

**Options:**
- `--containers`: Remove stopped containers
- `--images`: Remove dangling and unused images
- `--volumes`: Remove unused volumes (WARNING: Data loss)
- `--networks`: Remove unused networks
- `--all`: Clean up everything
- `--force`: Skip confirmation prompts
- `--help`: Show help message

**Examples:**
```bash
./scripts/cleanup.sh                  # Basic cleanup (containers + images)
./scripts/cleanup.sh --all           # Clean up everything
./scripts/cleanup.sh --all --force   # Clean up everything without prompts
./scripts/cleanup.sh --volumes       # Remove volumes (with confirmation)
```

### `deploy-cloudrun.sh`
Deploys the backend to Google Cloud Run.

```bash
./scripts/deploy-cloudrun.sh [OPTIONS]
```

**Options:**
- `--project PROJECT`: GCP project ID (required if not set via gcloud config)
- `--region REGION`: Cloud Run region (default: us-central1)
- `--dry-run`: Show what would be deployed without deploying
- `--help`: Show help message

**Examples:**
```bash
./scripts/deploy-cloudrun.sh --project my-cooking-app
./scripts/deploy-cloudrun.sh --project my-cooking-app --region us-west1
./scripts/deploy-cloudrun.sh --dry-run  # Preview deployment
```

### `setup-gcp.sh`
One-time GCP project setup for Cloud Run deployment.

```bash
./scripts/prod/setup-gcp.sh --project PROJECT_ID
```

**Features:**
- Enables required APIs (Cloud Run, Cloud Build, Container Registry)
- Configures gcloud defaults
- Provides next steps guidance

### `logs.sh`
Views or tails production logs from Google Cloud Run for local debugging.

```bash
./scripts/prod/logs.sh [OPTIONS]
```

**Options:**
- `-f, --follow, --tail`: Stream/tail live logs in real time
- `-n, --limit LIMIT`: Number of recent log entries to show (default: 50)
- `--service SERVICE`: Cloud Run service name (default: cooking-backend)
- `--region REGION`: Cloud Run region (default: us-central1)
- `--project PROJECT`: GCP project ID (defaults to active gcloud project)
- `--help`: Show help message

**Examples:**
```bash
./scripts/prod/logs.sh                   # View last 50 log entries
./scripts/prod/logs.sh -f                # Stream logs in real-time
./scripts/prod/logs.sh --limit 100       # View last 100 log entries
./scripts/prod/logs.sh -f --project my-p # Stream logs from specific project
```

## Security Setup

### JWT Secret Key Configuration

**IMPORTANT**: Before running the application in production, you must set a secure JWT secret key.

#### Generate a Secure Secret Key
```bash
# Option 1: Use the provided script
python backend/generate_secret_key.py

# Option 2: Use Python directly
python -c "import secrets; print(secrets.token_hex(32))"
```

#### Set the Secret Key
1. Copy the generated key
2. Create a `.env` file in the backend directory (if it doesn't exist)
3. Add the secret key:
```bash
SECRET_KEY=your_generated_256_bit_hex_key_here
```

#### Important Notes
- **Never use the default secret key in production**
- **Keep the same secret key across app restarts** to maintain user sessions
- **Never commit the secret key to version control**
- **Only change the secret key when you want to invalidate all existing tokens**
- **Consider using a secrets management service in production**

## Common Workflows

### Starting Development
```bash
# First time setup
./scripts/build.sh
./scripts/dev-start.sh
./scripts/migrate.sh

# Daily development
./scripts/dev-start.sh
```

### Database Operations
```bash
# Create a new migration
./scripts/migrate-create.sh "Add new feature"

# Apply migrations
./scripts/migrate.sh
```

### Cleanup and Maintenance
```bash
# Regular cleanup
./scripts/cleanup.sh

# Deep cleanup (removes all data)
./scripts/cleanup.sh --all

# Fresh start
./scripts/dev-stop.sh --cleanup --volumes
./scripts/cleanup.sh --all
./scripts/build.sh --force
./scripts/dev-start.sh
```

## Requirements

- Docker and Docker Compose installed
- All scripts must be run from the project root directory
- Backend service must be running for migration operations

## Troubleshooting

### Services Won't Start
1. Check Docker is running: `docker info`
2. Check for port conflicts: `lsof -i :3000,8000,5432`
3. Clean up and rebuild: `./scripts/cleanup.sh --all && ./scripts/build.sh --force`

### Database Connection Issues
1. Ensure database service is healthy: `docker-compose ps database`
2. Check database logs: `docker-compose logs database`
3. Restart database: `docker-compose restart database`

### Migration Failures
1. Check backend service is running: `docker-compose ps backend`
2. Check backend logs: `docker-compose logs backend`
3. Verify database connectivity: `docker-compose exec database pg_isready -U recipe_user -d recipe_db`

For more help, check the individual script help messages using the `--help` option.
