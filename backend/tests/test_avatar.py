"""
Tests for user avatar upload, removal, and public serving.
"""

import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.security_audit_log import SecurityAuditLog
from app.models.user import User
from app.utils.avatar import MAX_AVATAR_BYTES

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
GIF = b"GIF89a" + b"\x00" * 32
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 32

pytestmark = pytest.mark.api


def upload(
    client: TestClient,
    path: str,
    data: bytes,
    headers: dict | None = None,
    content_type: str = "image/png",
):
    return client.put(
        path,
        files={"file": ("avatar.bin", data, content_type)},
        headers=headers,
    )


class TestOwnAvatar:
    def test_upload_view_replace_delete(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        response = upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == test_user.id
        assert body["avatar_url"].startswith(f"/api/v1/users/{test_user.id}/avatar?v=")
        assert "avatar_data" not in body

        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.status_code == 200
        assert view.content == PNG
        assert view.headers["content-type"] == "image/png"

        replaced = upload(
            client, "/api/v1/users/me/avatar", JPEG, auth_headers, "image/jpeg"
        )
        assert replaced.status_code == 200
        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.content == JPEG
        assert view.headers["content-type"] == "image/jpeg"

        deleted = client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        assert deleted.status_code == 204
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404

    @pytest.mark.parametrize(
        "data,mime",
        [
            (PNG, "image/png"),
            (JPEG, "image/jpeg"),
            (GIF, "image/gif"),
            (WEBP, "image/webp"),
        ],
    )
    def test_accepts_each_allowed_type(
        self, client: TestClient, auth_headers: dict, test_user: User, data, mime
    ):
        response = upload(client, "/api/v1/users/me/avatar", data, auth_headers, "x/y")
        assert response.status_code == 200
        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.headers["content-type"] == mime

    def test_delete_is_idempotent(self, client: TestClient, auth_headers: dict):
        first = client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        second = client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        assert first.status_code == 204
        assert second.status_code == 204

    def test_view_headers(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.headers["x-content-type-options"] == "nosniff"
        assert "max-age" in view.headers["cache-control"]
        assert view.headers["etag"]

    def test_etag_conditional_get_and_change_on_replace(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        url = f"/api/v1/users/{test_user.id}/avatar"
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        etag = client.get(url).headers["etag"]

        not_modified = client.get(url, headers={"If-None-Match": etag})
        assert not_modified.status_code == 304
        assert not_modified.content == b""

        upload(client, "/api/v1/users/me/avatar", JPEG, auth_headers)
        new = client.get(url, headers={"If-None-Match": etag})
        assert new.status_code == 200
        assert new.headers["etag"] != etag

    def test_view_is_public_and_404_without_avatar(
        self, client: TestClient, test_user: User
    ):
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404
        assert client.get("/api/v1/users/U-NOPE/avatar").status_code == 404

    def test_avatar_url_in_profile(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        assert (
            client.get("/api/v1/users/profile/", headers=auth_headers).json()[
                "avatar_url"
            ]
            is None
        )

        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        profile = client.get("/api/v1/users/profile/", headers=auth_headers).json()
        assert profile["avatar_url"].startswith(
            f"/api/v1/users/{test_user.id}/avatar?v="
        )
        assert "avatar_data" not in profile

        client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        profile = client.get("/api/v1/users/profile/", headers=auth_headers).json()
        assert profile["avatar_url"] is None

    def test_avatar_url_version_is_updated_at_epoch(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_user: User,
    ):
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        db_session.refresh(test_user)
        expected = int(test_user.avatar_updated_at.timestamp())
        profile = client.get("/api/v1/users/profile/", headers=auth_headers).json()
        assert profile["avatar_url"].endswith(f"?v={expected}")

    def test_upload_is_audit_logged(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_user: User,
    ):
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        logs = (
            db_session.query(SecurityAuditLog)
            .filter(
                SecurityAuditLog.user_id == test_user.id,
                SecurityAuditLog.event_type == "profile_updated",
            )
            .all()
        )
        changes = [json.loads(log.details)["changes"]["avatar"] for log in logs]
        assert sorted(changes) == ["removed", "updated"]


class TestAvatarValidation:
    def test_oversize_returns_413(self, client: TestClient, auth_headers: dict):
        too_big = PNG + b"\x00" * (MAX_AVATAR_BYTES - len(PNG) + 1)
        response = upload(client, "/api/v1/users/me/avatar", too_big, auth_headers)
        assert response.status_code == 413

    def test_exactly_max_size_is_accepted(self, client: TestClient, auth_headers: dict):
        at_limit = PNG + b"\x00" * (MAX_AVATAR_BYTES - len(PNG))
        response = upload(client, "/api/v1/users/me/avatar", at_limit, auth_headers)
        assert response.status_code == 200

    def test_spoofed_non_image_rejected(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        response = upload(
            client,
            "/api/v1/users/me/avatar",
            b"<html><script>alert(1)</script></html>",
            auth_headers,
            "image/png",
        )
        assert response.status_code == 415
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404

    def test_unsupported_image_type_rejected(
        self, client: TestClient, auth_headers: dict
    ):
        response = upload(
            client,
            "/api/v1/users/me/avatar",
            b"BM" + b"\x00" * 32,
            auth_headers,
            "image/bmp",
        )
        assert response.status_code == 415

    def test_missing_file_field_is_422(self, client: TestClient, auth_headers: dict):
        response = client.put(
            "/api/v1/users/me/avatar", data={"other": "x"}, headers=auth_headers
        )
        assert response.status_code == 422


class TestAvatarAuthorization:
    def test_writes_require_authentication(self, client: TestClient, test_user: User):
        for path in ("/api/v1/users/me/avatar", f"/api/v1/users/{test_user.id}/avatar"):
            assert upload(client, path, PNG).status_code == 401
            assert client.delete(path).status_code == 401

    def test_other_non_admin_user_gets_403(
        self,
        client: TestClient,
        auth_headers: dict,
        auth_headers_user2: dict,
        test_user: User,
    ):
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        path = f"/api/v1/users/{test_user.id}/avatar"

        assert upload(client, path, JPEG, auth_headers_user2).status_code == 403
        assert client.delete(path, headers=auth_headers_user2).status_code == 403
        assert client.get(path).content == PNG

    def test_user_can_manage_own_avatar_by_id(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        path = f"/api/v1/users/{test_user.id}/avatar"
        assert upload(client, path, PNG, auth_headers).status_code == 200
        assert client.delete(path, headers=auth_headers).status_code == 204

    def test_admin_can_manage_other_users_avatar(
        self,
        client: TestClient,
        admin_auth_headers: dict,
        test_user: User,
    ):
        path = f"/api/v1/users/{test_user.id}/avatar"
        response = upload(client, path, PNG, admin_auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == test_user.id
        assert client.get(path).content == PNG

        assert client.delete(path, headers=admin_auth_headers).status_code == 204
        assert client.get(path).status_code == 404

    def test_admin_unknown_user_is_404(
        self, client: TestClient, admin_auth_headers: dict
    ):
        path = "/api/v1/users/U-UNKNOWN/avatar"
        assert upload(client, path, PNG, admin_auth_headers).status_code == 404
        assert client.delete(path, headers=admin_auth_headers).status_code == 404

    def test_non_admin_unknown_user_is_403_not_404(
        self, client: TestClient, auth_headers: dict
    ):
        path = "/api/v1/users/U-UNKNOWN/avatar"
        assert upload(client, path, PNG, auth_headers).status_code == 403
