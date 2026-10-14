"""
Tests for personal API token management and revocation.
"""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.api_token import ApiToken
from app.models.user import User
from app.utils.api_tokens import hash_api_token, resolve_api_token
from app.utils.auth import revoke_user_tokens


@pytest.mark.integration
class TestApiTokenEndpoints:
    def test_create_returns_secret_once(
        self, client: TestClient, auth_headers: dict, db_session: Session
    ):
        response = client.post(
            "/api/v1/users/api-tokens/",
            json={"name": "Claude Code", "scopes": ["recipes:read"]},
            headers=auth_headers,
        )

        assert response.status_code == 201
        created = response.json()
        assert created["token"].startswith("crc_")
        assert created["token"].startswith(created["token_prefix"])
        assert created["scopes"] == ["recipes:read"]

        stored = db_session.get(ApiToken, created["id"])
        assert stored.token_hash == hash_api_token(created["token"])

        listed = client.get("/api/v1/users/api-tokens/", headers=auth_headers).json()
        assert [token["id"] for token in listed] == [created["id"]]
        assert "token" not in listed[0]

    def test_rejects_unknown_scope(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/v1/users/api-tokens/",
            json={"name": "Too much", "scopes": ["users:admin"]},
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_api_token_cannot_manage_tokens_or_call_rest(
        self, client: TestClient, auth_headers: dict
    ):
        token = client.post(
            "/api/v1/users/api-tokens/", json={"name": "MCP"}, headers=auth_headers
        ).json()["token"]
        api_headers = {"Authorization": f"Bearer {token}"}

        assert (
            client.get("/api/v1/users/api-tokens/", headers=api_headers).status_code
            == 401
        )
        assert (
            client.post(
                "/api/v1/recipes/",
                json={"title": "Nope", "description": "<p>x</p>"},
                headers=api_headers,
            ).status_code
            == 401
        )

    def test_revoke(self, client: TestClient, auth_headers: dict, db_session: Session):
        created = client.post(
            "/api/v1/users/api-tokens/", json={"name": "MCP"}, headers=auth_headers
        ).json()

        response = client.delete(
            f"/api/v1/users/api-tokens/{created['id']}/", headers=auth_headers
        )

        assert response.status_code == 204
        assert resolve_api_token(db_session, created["token"]) is None

    def test_cannot_revoke_other_users_token(
        self, client: TestClient, auth_headers: dict, auth_headers_user2: dict
    ):
        created = client.post(
            "/api/v1/users/api-tokens/", json={"name": "MCP"}, headers=auth_headers
        ).json()

        response = client.delete(
            f"/api/v1/users/api-tokens/{created['id']}/", headers=auth_headers_user2
        )

        assert response.status_code == 404


def _add_token(db: Session, user: User, raw: str, **kwargs) -> ApiToken:
    api_token = ApiToken(
        user_id=user.id,
        name="test",
        token_hash=hash_api_token(raw),
        token_prefix=raw[:12],
        scopes=["recipes:read"],
        **kwargs,
    )
    db.add(api_token)
    db.commit()
    return api_token


@pytest.mark.unit
class TestResolveApiToken:
    def test_resolves_live_token_and_records_use(
        self, db_session: Session, test_user: User
    ):
        api_token = _add_token(db_session, test_user, "crc_live")

        user, resolved = resolve_api_token(db_session, "crc_live")

        assert user.id == test_user.id
        assert resolved.id == api_token.id
        assert resolved.last_used_at is not None

    def test_rejects_expired_token(self, db_session: Session, test_user: User):
        _add_token(
            db_session,
            test_user,
            "crc_expired",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        assert resolve_api_token(db_session, "crc_expired") is None

    def test_rejects_unknown_or_jwt_shaped_token(self, db_session: Session):
        assert resolve_api_token(db_session, "crc_unknown") is None
        assert resolve_api_token(db_session, "eyJhbGciOiJIUzI1NiJ9.e30.x") is None

    def test_credential_revocation_revokes_api_tokens(
        self, db_session: Session, test_user: User
    ):
        _add_token(db_session, test_user, "crc_revoke_me")

        revoke_user_tokens(test_user)
        db_session.commit()

        assert resolve_api_token(db_session, "crc_revoke_me") is None
