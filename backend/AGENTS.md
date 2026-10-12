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

- **Start Server**: `../scripts/local/start.sh` (Runs Dockerized backend)
- **Run Tests**: `../scripts/local/test.sh`
- **Database Migrations**:
  - Create: `../scripts/local/migrate-create.sh "description"`
  - Apply: `../scripts/local/migrate.sh`

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
- **Sync handlers**: Use plain `def` for route handlers. SQLAlchemy sessions and bcrypt are blocking; FastAPI runs `def` handlers in its threadpool, whereas blocking calls inside `async def` stall every request on the instance. Only use `async def` for handlers that exclusively `await` non-blocking I/O.
- **Dangling Commas**: Prefer trailing commas in multi-line lists/dicts for cleaner diffs.

## 5. Security & Best Practices
- **Dependencies**: Pin versions in `requirements.txt`.
- **SQL Injection**: ALWAYS use SQLAlchemy ORM methods or parameterized queries.
- **Validation**: Rely on Pydantic schemas to validate incoming JSON.
- **Rich text / HTML**: Any user-authored HTML must pass through `app/utils/html_validator.sanitize_html` (via the schema validators). The frontend renders it as raw HTML, so the allowlist there is the XSS boundary; extend it deliberately.
- **Auth tokens**: JWTs carry `sub` = user ID and `tv` = `users.token_version`. Issue tokens with `create_token_pair(user)`; resolve them with `get_user_from_token`. Call `revoke_user_tokens(user)` whenever credentials change (password change/reset, `POST /users/logout-all/`). Refresh tokens rotate on every `/users/refresh/` call.
- **Abuse protection**: Login, register, refresh, forgot/reset password and change-password are rate limited per IP via `app/utils/rate_limit.limiter` (slowapi, in-memory per instance). Registration and forgot-password require a Cloudflare Turnstile token. Client IPs come from `app/utils/client_ip.get_client_ip`, which trusts only the right-most `X-Forwarded-For` hop(s) (`FORWARDED_FOR_TRUSTED_HOPS`).
- **Production secrets**: With `DEBUG=false` the app refuses to start unless `SECRET_KEY` (32+ chars, non-default) and a real `TURNSTILE_SECRET_KEY` are set.
- **Secrets**: Read from `os.environ` or `fastapi.config`. Never commit secrets.

## 6. Testing Guidelines
- **Coverage**: target 80%+.
- **Fixtures**: Use `conftest.py` for DB sessions and test data.
- **Mocking**: Mock external APIs (Email, S3, etc.) to keep tests fast and deterministic.

## 7. Production Deployment (Cloud Run)
- **Deploy**: `../scripts/prod/deploy.sh --project YOUR_PROJECT_ID`
- **First-time Setup**: `../scripts/prod/setup-gcp.sh --project YOUR_PROJECT_ID`
- **Config**: See `infrastructure/cloudrun/` for Cloud Build and service configuration
- **Secrets**: Ensure `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, and `TURNSTILE_SECRET_KEY` are configured in Secret Manager and passed in `cloudbuild.yaml`.
