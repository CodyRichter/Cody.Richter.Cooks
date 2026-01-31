# AGENTS.md (Backend)

> [!NOTE]
> This document guides AI agents on working within the `backend/` directory.

## 1. Core Technology Stack
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL (Async via SQLAlchemy 2.0+)
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Testing**: Pytest

## 2. Directory Structure (`app/`)
- `api/`: API Endpoints (Routes). Split by domain/resource (e.g., `api/users.py`).
- `core/`: Config, Security, Database setup, Middleware.
- `models/`: **SQLAlchemy ORM Models**. This is the source of truth for the DB schema.
- `schemas/`: **Pydantic Models**. Request/Response DTOs.
- `services/`: Business logic layer (Keep route handlers thin!).
- `tests/`: Pytest suite.

## 3. Development Workflow
**CRITICAL**: Do NOT run `uvicorn` or `pytest` directly on the host machine unless you are 100% sure the environment is set up. Prefer the scripts in `scripts/`.

- **Start Server**: `../scripts/dev-start.sh` (Runs Dockerized backend)
- **Run Tests**: `../scripts/test.sh`
- **Database Migrations**:
  - Create: `../scripts/migrate-create.sh "description"`
  - Apply: `../scripts/migrate.sh`

### Local Setup (If working outside Docker)
If you MUST run locally (e.g., for IDE support):
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Env vars must be loaded from .env manually or via python-dotenv
```

## 4. Coding Standards (Python)
- **Style**: Follow PEP 8.
- **Type Hints**: **MANDATORY** for all function arguments and returns. `def foo(x: int) -> str:`
- **Async**: Use `async def` for all route handlers and DB access.
- **Dangling Commas**: Prefer trailing commas in multi-line lists/dicts for cleaner diffs.

## 5. Security & Best Practices
- **Dependencies**: Pin versions in `requirements.txt`.
- **SQL Injection**: ALWAYS use SQLAlchemy ORM methods or parameterized queries.
- **Validation**: Rely on Pydantic schemas to validate incoming JSON.
- **Secrets**: Read from `os.environ` or `fastapi.config`. Never commit secrets.

## 6. Testing Guidelines
- **Coverage**: target 80%+.
- **Fixtures**: Use `conftest.py` for DB sessions and test data.
- **Mocking**: Mock external APIs (Email, S3, etc.) to keep tests fast and deterministic.

## 7. Production Deployment (Cloud Run)
- **Deploy**: `../scripts/deploy-cloudrun.sh --project YOUR_PROJECT_ID`
- **First-time Setup**: `../scripts/setup-gcp.sh --project YOUR_PROJECT_ID`
- **Config**: See `infrastructure/cloudrun/` for Cloud Build and service configuration
- **Secrets**: Set `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` in Cloud Run Console
