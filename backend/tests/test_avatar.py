"""
Tests for user avatar upload, removal, and public serving.
"""

import io
import json
import struct
import zlib

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageCms
from sqlalchemy.orm import Session

from app.models.recipe import Recipe
from app.models.security_audit_log import SecurityAuditLog
from app.models.user import User
from app.utils.avatar import MAX_AVATAR_BYTES, MAX_AVATAR_DIMENSION


def make_image(
    fmt: str, size: tuple[int, int] = (64, 48), mode: str = "RGB", **save_kwargs
) -> bytes:
    buffer = io.BytesIO()
    color = (200, 30, 30) if mode == "RGB" else 0
    Image.new(mode, size, color).save(buffer, format=fmt, **save_kwargs)
    return buffer.getvalue()


def png_header_only(width: int, height: int) -> bytes:
    """A PNG signature + IHDR claiming huge dimensions, with no pixel data."""

    def chunk(kind: bytes, body: bytes) -> bytes:
        crc = zlib.crc32(kind + body) & 0xFFFFFFFF
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 1, 0, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)


def decode(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    image.load()
    return image


PNG = make_image("PNG")
JPEG = make_image("JPEG")
GIF = make_image("GIF")
WEBP = make_image("WEBP")

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
        assert view.headers["content-type"] == "image/webp"
        assert decode(view.content).size == (64, 48)
        first = view.content

        replaced = upload(
            client,
            "/api/v1/users/me/avatar",
            make_image("JPEG", (32, 32)),
            auth_headers,
            "image/jpeg",
        )
        assert replaced.status_code == 200
        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.content != first
        assert decode(view.content).size == (32, 32)
        assert view.headers["content-type"] == "image/webp"

        deleted = client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        assert deleted.status_code == 204
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404

    @pytest.mark.parametrize("data", [PNG, JPEG, GIF, WEBP], ids=lambda d: d[:4].hex())
    def test_accepts_each_allowed_type_and_stores_webp(
        self, client: TestClient, auth_headers: dict, test_user: User, data
    ):
        response = upload(client, "/api/v1/users/me/avatar", data, auth_headers, "x/y")
        assert response.status_code == 200
        view = client.get(f"/api/v1/users/{test_user.id}/avatar")
        assert view.headers["content-type"] == "image/webp"
        assert decode(view.content).format == "WEBP"

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

    def test_max_size_is_ten_megabytes(self):
        assert MAX_AVATAR_BYTES == 10 * 1024 * 1024

    def test_exactly_max_size_is_accepted(self, client: TestClient, auth_headers: dict):
        at_limit = PNG + b"\x00" * (MAX_AVATAR_BYTES - len(PNG))
        response = upload(client, "/api/v1/users/me/avatar", at_limit, auth_headers)
        assert response.status_code == 200

    def test_over_two_megabytes_is_accepted_now(
        self, client: TestClient, auth_headers: dict
    ):
        three_mb = PNG + b"\x00" * (3 * 1024 * 1024)
        response = upload(client, "/api/v1/users/me/avatar", three_mb, auth_headers)
        assert response.status_code == 200

    def test_corrupt_image_returns_415(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        truncated = PNG[: len(PNG) // 2]
        garbage = PNG[:20] + b"\xde\xad\xbe\xef" * 64
        for data in (truncated, garbage, JPEG[:30]):
            response = upload(client, "/api/v1/users/me/avatar", data, auth_headers)
            assert response.status_code == 415
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404

    @pytest.mark.parametrize("size", [(100_000, 100_000), (8_000, 8_000)])
    def test_pixel_bomb_returns_415(
        self, client: TestClient, auth_headers: dict, test_user: User, size
    ):
        response = upload(
            client, "/api/v1/users/me/avatar", png_header_only(*size), auth_headers
        )
        assert response.status_code == 415
        assert client.get(f"/api/v1/users/{test_user.id}/avatar").status_code == 404

    def test_real_highly_compressed_bomb_returns_415(
        self, client: TestClient, auth_headers: dict
    ):
        bomb = make_image("PNG", (20_000, 20_000), mode="1")
        assert len(bomb) < MAX_AVATAR_BYTES
        response = upload(client, "/api/v1/users/me/avatar", bomb, auth_headers)
        assert response.status_code == 415

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


class TestAvatarNormalization:
    def upload_and_fetch(
        self, client: TestClient, headers: dict, user: User, data: bytes
    ) -> bytes:
        response = upload(client, "/api/v1/users/me/avatar", data, headers)
        assert response.status_code == 200
        view = client.get(f"/api/v1/users/{user.id}/avatar")
        assert view.headers["content-type"] == "image/webp"
        return view.content

    @pytest.mark.parametrize(
        "fmt,size",
        [
            ("JPEG", (2000, 1000)),
            ("PNG", (1000, 3000)),
            ("WEBP", (1500, 1500)),
            ("GIF", (700, 600)),
        ],
    )
    def test_large_image_is_downscaled_keeping_aspect_ratio(
        self, client: TestClient, auth_headers: dict, test_user: User, fmt, size
    ):
        stored = self.upload_and_fetch(
            client, auth_headers, test_user, make_image(fmt, size)
        )
        width, height = decode(stored).size
        assert max(width, height) == MAX_AVATAR_DIMENSION
        assert width / height == pytest.approx(size[0] / size[1], rel=0.02)

    @pytest.mark.parametrize("size", [(100, 50), (512, 512), (512, 300)])
    def test_small_image_is_never_upscaled(
        self, client: TestClient, auth_headers: dict, test_user: User, size
    ):
        stored = self.upload_and_fetch(
            client, auth_headers, test_user, make_image("PNG", size)
        )
        assert decode(stored).size == size

    def test_exif_orientation_is_applied(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        exif = Image.Exif()
        exif[0x0112] = 6
        data = make_image("JPEG", (200, 100), exif=exif.tobytes())
        assert Image.open(io.BytesIO(data)).size == (200, 100)

        stored = self.upload_and_fetch(client, auth_headers, test_user, data)
        assert decode(stored).size == (100, 200)

    def test_metadata_is_stripped(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        exif = Image.Exif()
        exif[0x0112] = 1
        exif[0x010F] = "SecretCameraMaker"
        exif[0x0131] = "SecretSoftware"
        exif.get_ifd(0x8825)[1] = "N"
        profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
        data = make_image(
            "JPEG", (300, 200), exif=exif.tobytes(), icc_profile=profile, comment=b"hi"
        )
        source = Image.open(io.BytesIO(data))
        assert source.getexif().get(0x010F) == "SecretCameraMaker"
        assert source.info.get("icc_profile")

        stored = self.upload_and_fetch(client, auth_headers, test_user, data)

        result = decode(stored)
        assert not result.getexif()
        assert "exif" not in result.info
        assert "icc_profile" not in result.info
        assert "xmp" not in result.info
        for needle in (b"SecretCameraMaker", b"SecretSoftware", b"EXIF", b"ICCP"):
            assert needle not in stored

    def test_animated_gif_keeps_only_first_frame(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        buffer = io.BytesIO()
        frames = [Image.new("RGB", (80, 60), c) for c in ("red", "blue")]
        frames[0].save(buffer, format="GIF", save_all=True, append_images=frames[1:])
        assert Image.open(io.BytesIO(buffer.getvalue())).n_frames == 2

        stored = self.upload_and_fetch(
            client, auth_headers, test_user, buffer.getvalue()
        )
        result = decode(stored)
        assert getattr(result, "n_frames", 1) == 1
        red, _, _ = result.convert("RGB").getpixel((40, 30))
        assert red > 150

    def test_transparency_is_preserved(
        self, client: TestClient, auth_headers: dict, test_user: User
    ):
        buffer = io.BytesIO()
        Image.new("RGBA", (40, 40), (255, 0, 0, 0)).save(buffer, format="PNG")
        stored = self.upload_and_fetch(
            client, auth_headers, test_user, buffer.getvalue()
        )
        result = decode(stored)
        assert result.mode == "RGBA"
        assert result.getpixel((20, 20))[3] == 0

    def test_stored_size_is_the_normalized_size_in_audit_log(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_user: User,
    ):
        stored = self.upload_and_fetch(
            client, auth_headers, test_user, make_image("PNG", (2000, 2000))
        )
        log = (
            db_session.query(SecurityAuditLog)
            .filter(SecurityAuditLog.event_type == "profile_updated")
            .one()
        )
        details = json.loads(log.details)
        assert details["content_type"] == "image/webp"
        assert details["size_bytes"] == len(stored)


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
        original = client.get(path).content

        assert upload(client, path, JPEG, auth_headers_user2).status_code == 403
        assert client.delete(path, headers=auth_headers_user2).status_code == 403
        assert client.get(path).content == original

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
        assert decode(client.get(path).content).format == "WEBP"

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


class TestRecipePermissionAvatarUrl:
    def test_owner_avatar_url_in_permissions_for_everyone(
        self,
        client: TestClient,
        test_recipe: Recipe,
        test_user: User,
        auth_headers: dict,
        auth_headers_user2: dict,
    ):
        url = f"/api/v1/recipes/{test_recipe.id}/permissions/"

        before = client.get(url).json()
        assert len(before) == 1
        assert before[0]["user_avatar_url"] is None

        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers)
        expected = client.get("/api/v1/users/profile/", headers=auth_headers).json()[
            "avatar_url"
        ]
        assert expected.startswith(f"/api/v1/users/{test_user.id}/avatar?v=")

        for headers in (None, auth_headers_user2, auth_headers):
            owner = [
                p
                for p in client.get(url, headers=headers).json()
                if p["role"] == "owner"
            ]
            assert owner[0]["user_avatar_url"] == expected

        client.delete("/api/v1/users/me/avatar", headers=auth_headers)
        assert client.get(url).json()[0]["user_avatar_url"] is None

    def test_collaborator_avatar_url_visible_to_owner(
        self,
        client: TestClient,
        test_recipe: Recipe,
        test_user2: User,
        auth_headers: dict,
        auth_headers_user2: dict,
    ):
        url = f"/api/v1/recipes/{test_recipe.id}/permissions/"
        granted = client.post(
            url,
            json={"username": test_user2.username, "role": "editor"},
            headers=auth_headers,
        )
        assert granted.status_code == 201
        upload(client, "/api/v1/users/me/avatar", PNG, auth_headers_user2)

        editor = [
            p
            for p in client.get(url, headers=auth_headers).json()
            if p["user_id"] == test_user2.id
        ]
        assert editor[0]["user_avatar_url"].startswith(
            f"/api/v1/users/{test_user2.id}/avatar?v="
        )
