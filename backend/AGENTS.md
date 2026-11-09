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
- **Personal API tokens** (`app/models/api_token.py`, `app/utils/api_tokens.py`): `crc_`-prefixed, stored as SHA-256 hashes, scoped to `recipes:read` / `recipes:write`. They are accepted **only** by the MCP endpoint; `get_current_user` (all REST routes) accepts JWTs only, and token management (`/api/v1/users/api-tokens/`) requires a JWT. `revoke_user_tokens` also revokes every API token.
- **Production secrets**: With `DEBUG=false` the app refuses to start unless `SECRET_KEY` (32+ chars, non-default) and a real `TURNSTILE_SECRET_KEY` are set.
- **Secrets**: Read from `os.environ` or `fastapi.config`. Never commit secrets.

## 6. MCP Server (`app/handlers/mcp_server.py`)
- Streamable HTTP at exactly `/mcp` (stateless, JSON responses), built on the official `mcp` SDK (v2: `MCPServer`, not `FastMCP`). Auth is a bearer personal API token via `ApiTokenVerifier`.
- Tools are an explicit allowlist: `search_recipes`, `list_my_recipes`, `get_recipe`, `create_recipe`, `update_recipe`. They call the `*_internal` recipe functions, so permissions and HTML sanitization match REST. Do not add delete, sharing, or account tools without revisiting the token scopes.
- Each tool checks its scope with `_authorized_session`; `HTTPException`/`ValidationError` become `ToolError` messages for the model.
- Inline `data:` images in descriptions are returned as `src="embedded-image:N"` placeholders and restored on `update_recipe`, keeping tool output small.
- `McpApp` rebuilds the Streamable HTTP app on every app lifespan (an SDK session manager can only run once), which keeps repeated `TestClient(app)` lifespans working.
- Connect a client: `claude mcp add --transport http cooking <API_URL>/mcp --header "Authorization: Bearer <token>"`. Tokens are created on the frontend account page.
- OAuth (needed for claude.ai web connectors) is not implemented; `AuthSettings.issuer_url` comes from `API_PUBLIC_URL`, and the token verifier is the extension point.

## 6a. User Avatars (`app/handlers/users`, `app/utils/avatar.py`)
Profile pictures are stored in Postgres on `users` (`avatar_data` LargeBinary, deferred so ordinary user queries never load the bytes; `avatar_content_type`; `avatar_updated_at`). `UserResponseSchema.avatar_url` is `/api/v1/users/{id}/avatar?v=<avatar_updated_at epoch>` or `null`; the bytes are never in JSON.

| Endpoint | Auth | Behavior |
|---|---|---|
| `PUT /api/v1/users/me/avatar` | JWT | Multipart field `file`. Returns `UserResponseSchema`. |
| `DELETE /api/v1/users/me/avatar` | JWT | `204`; idempotent. |
| `PUT /api/v1/users/{user_id}/avatar` | JWT, that user or `is_admin` | Same as above for another user. Others get `403` (checked before existence, so non-admins cannot probe ids); admins get `404` for an unknown user. |
| `DELETE /api/v1/users/{user_id}/avatar` | JWT, that user or `is_admin` | `204`; idempotent. |
| `GET /api/v1/users/{user_id}/avatar` | none | Raw bytes with the stored `Content-Type`, `ETag` (honors `If-None-Match` with `304`), `Cache-Control`, `X-Content-Type-Options: nosniff`; `404` if the user has no avatar. |

- Allowed input types: png, jpeg, webp, gif, identified from **magic bytes** (`sniff_image_type`); the declared Content-Type and filename are ignored. Anything else is `415`. Max raw upload 10 MB (`MAX_AVATAR_BYTES`), otherwise `413`.
- Every upload is **normalized** by `normalize_avatar` (Pillow, pinned in `requirements.txt`): decoded, EXIF orientation applied, downscaled so the longest side is at most 512 px (`MAX_AVATAR_DIMENSION`; aspect ratio kept, never upscaled), and re-encoded as WebP (quality 85; animated GIFs keep the first frame) so all metadata (EXIF, GPS, ICC, XMP) is dropped. The stored bytes are always `image/webp`.
- Images over `MAX_IMAGE_PIXELS` (50 million, checked from the header before decoding; also sets Pillow's `Image.MAX_IMAGE_PIXELS` and catches `DecompressionBombError`) and undecodable or corrupt files are rejected with `415`.
- Avatar changes are written to the audit log as `profile_updated` events (`details.changes.avatar` is `updated` or `removed`, plus `target_user_id`); deleting when there is no avatar logs nothing.
- `GET /api/v1/recipes/{id}/permissions/` returns `user_avatar_url` (same value as `User.avatar_url`, or `null`) next to `user_username` for every listed permission, including the owner-only list shown to the public.
- Uploads need `python-multipart` (in `requirements.txt`).
- Every avatar route is also registered with a trailing slash (hidden from the schema), because the frontend `apiClient` always appends `/`. Do not rely on FastAPI's slash redirect: behind Cloud Run it redirects to `http://`, which browsers block on an HTTPS page.

## 7. Testing Guidelines
- **Coverage**: target 80%+.
- **Fixtures**: Use `conftest.py` for DB sessions and test data.
- **Test database**: Tests run on Postgres, never SQLite. `conftest.py` recreates `<DATABASE_URL db>_test` (override with `TEST_DATABASE_URL`) and builds it with `alembic upgrade head` once per session; tables are truncated after each test.
- **Migrations**: `tests/test_migrations.py` runs `alembic check`; any model change without a migration fails the suite.
- **Mocking**: Mock external APIs (Email, S3, etc.) to keep tests fast and deterministic.

## 8. Production Deployment (Cloud Run)
- **Deploy**: `../scripts/prod/deploy.sh --project YOUR_PROJECT_ID`
- **First-time Setup**: `../scripts/prod/setup-gcp.sh --project YOUR_PROJECT_ID`
- **Config**: See `infrastructure/cloudrun/` for Cloud Build and service configuration
- **Secrets**: Ensure `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, and `TURNSTILE_SECRET_KEY` are configured in Secret Manager and passed in `cloudbuild.yaml`.
