"""
Tests for the recipe MCP server mounted at /mcp.
"""

from typing import Any, Optional

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.handlers import mcp_server
from app.models.api_token import ApiToken
from app.models.recipe import Recipe
from app.models.user import User
from app.utils.api_tokens import hash_api_token
from tests.conftest import TestingSessionLocal

PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


@pytest.fixture(autouse=True)
def mcp_uses_test_database(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(mcp_server, "SessionLocal", TestingSessionLocal)


def _token(db: Session, user: User, scopes: list[str], raw: str) -> str:
    db.add(
        ApiToken(
            user_id=user.id,
            name="test",
            token_hash=hash_api_token(raw),
            token_prefix=raw[:12],
            scopes=scopes,
        )
    )
    db.commit()
    return raw


@pytest.fixture
def write_token(db_session: Session, test_user: User) -> str:
    return _token(db_session, test_user, ["recipes:read", "recipes:write"], "crc_rw")


@pytest.fixture
def read_token(db_session: Session, test_user: User) -> str:
    return _token(db_session, test_user, ["recipes:read"], "crc_ro")


def _rpc(client: TestClient, token: Optional[str], method: str, params: dict[str, Any]):
    headers = {"Accept": "application/json, text/event-stream"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post(
        "/mcp",
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        headers=headers,
    )


def _call(client: TestClient, token: str, tool: str, arguments: dict) -> dict:
    response = _rpc(client, token, "tools/call", {"name": tool, "arguments": arguments})
    assert response.status_code == 200
    return response.json()["result"]


def _error_text(result: dict) -> str:
    assert result["isError"] is True
    return result["content"][0]["text"]


NEW_RECIPE = {
    "title": "Weeknight Toast",
    "description": "<p>Crunchy.</p>",
    "tags": ["breakfast"],
    "cooking_time": 5,
    "ingredients": [
        {"name": "Bread", "quantity": 2, "unit": "slices"},
        {"name": "Salt", "quantity": 1, "unit": "pinch", "subtext": "to taste"},
    ],
    "instructions": [
        {"title": "Toast", "description": "<p>Toast the bread.</p>", "timing": 3},
        {"title": "Season", "description": "<p>Salt it.</p>"},
    ],
}


@pytest.mark.integration
class TestMcpAuth:
    def test_requires_bearer_token(self, client: TestClient):
        assert _rpc(client, None, "tools/list", {}).status_code == 401

    def test_rejects_jwt(self, client: TestClient, auth_headers: dict):
        jwt = auth_headers["Authorization"].removeprefix("Bearer ")
        assert _rpc(client, jwt, "tools/list", {}).status_code == 401

    def test_rejects_revoked_token(
        self, client: TestClient, db_session: Session, write_token: str
    ):
        db_session.query(ApiToken).update({ApiToken.revoked_at: ApiToken.created_at})
        db_session.commit()
        assert _rpc(client, write_token, "tools/list", {}).status_code == 401

    def test_exposes_only_allowlisted_tools(self, client: TestClient, read_token: str):
        response = _rpc(client, read_token, "tools/list", {})

        names = {tool["name"] for tool in response.json()["result"]["tools"]}
        assert names == {
            "search_recipes",
            "list_my_recipes",
            "get_recipe",
            "create_recipe",
            "update_recipe",
        }

    def test_read_only_token_cannot_write(self, client: TestClient, read_token: str):
        result = _call(client, read_token, "create_recipe", NEW_RECIPE)
        assert "recipes:write" in _error_text(result)


@pytest.mark.integration
class TestMcpRecipeTools:
    def test_create_recipe_assigns_order_and_ownership(
        self, client: TestClient, write_token: str, auth_headers: dict
    ):
        recipe = _call(client, write_token, "create_recipe", NEW_RECIPE)[
            "structuredContent"
        ]

        assert [i["order_index"] for i in recipe["ingredients"]] == [0, 1]
        assert [s["step_number"] for s in recipe["instructions"]] == [1, 2]
        mine = client.get("/api/v1/recipes/my-recipes/", headers=auth_headers).json()
        assert [item["id"] for item in mine["items"]] == [recipe["id"]]

    def test_update_only_changes_given_fields(
        self, client: TestClient, write_token: str, test_recipe_with_details: Recipe
    ):
        result = _call(
            client,
            write_token,
            "update_recipe",
            {"recipe_id": test_recipe_with_details.id, "title": "Renamed"},
        )

        recipe = result["structuredContent"]
        assert recipe["title"] == "Renamed"
        assert recipe["cooking_time"] == 45
        assert len(recipe["ingredients"]) == 2
        assert len(recipe["instructions"]) == 2

    def test_update_replaces_ingredient_list(
        self, client: TestClient, write_token: str, test_recipe_with_details: Recipe
    ):
        result = _call(
            client,
            write_token,
            "update_recipe",
            {
                "recipe_id": test_recipe_with_details.id,
                "ingredients": [{"name": "Rye flour", "quantity": 3, "unit": "cups"}],
            },
        )

        recipe = result["structuredContent"]
        assert [i["name"] for i in recipe["ingredients"]] == ["Rye flour"]
        assert len(recipe["instructions"]) == 2

    def test_cannot_update_someone_elses_recipe(
        self,
        client: TestClient,
        db_session: Session,
        test_user2: User,
        test_recipe: Recipe,
    ):
        other_token = _token(db_session, test_user2, ["recipes:write"], "crc_other")

        result = _call(
            client,
            other_token,
            "update_recipe",
            {"recipe_id": test_recipe.id, "title": "Hijacked"},
        )

        _error_text(result)
        db_session.refresh(test_recipe)
        assert test_recipe.title != "Hijacked"

    def test_invalid_html_is_sanitized(self, client: TestClient, write_token: str):
        recipe = _call(
            client,
            write_token,
            "create_recipe",
            {**NEW_RECIPE, "description": "<p>Hi</p><script>alert(1)</script>"},
        )["structuredContent"]

        assert "<script>" not in recipe["description"]

    def test_search_and_list_my_recipes(
        self, client: TestClient, read_token: str, test_recipe: Recipe
    ):
        found = _call(
            client, read_token, "search_recipes", {"query": test_recipe.title}
        )
        mine = _call(client, read_token, "list_my_recipes", {})

        assert [r["id"] for r in found["structuredContent"]["items"]] == [
            test_recipe.id
        ]
        assert [r["id"] for r in mine["structuredContent"]["items"]] == [test_recipe.id]


@pytest.mark.integration
class TestMcpEmbeddedImages:
    def test_images_round_trip_through_placeholders(
        self, client: TestClient, write_token: str
    ):
        created = _call(
            client,
            write_token,
            "create_recipe",
            {
                **NEW_RECIPE,
                "description": f'<p>Look</p><img src="{PIXEL}" alt="toast">',
            },
        )["structuredContent"]
        assert 'src="embedded-image:1"' in created["description"]
        assert "base64" not in created["description"]

        _call(
            client,
            write_token,
            "update_recipe",
            {
                "recipe_id": created["id"],
                "description": '<p>Updated</p><img src="embedded-image:1" alt="toast">',
            },
        )

        stored = client.get(f"/api/v1/recipes/{created['id']}/").json()
        assert stored["description"].startswith("<p>Updated</p>")
        assert PIXEL in stored["description"]

    def test_unknown_placeholder_is_an_error(
        self, client: TestClient, write_token: str, test_recipe: Recipe
    ):
        result = _call(
            client,
            write_token,
            "update_recipe",
            {
                "recipe_id": test_recipe.id,
                "description": '<img src="embedded-image:3">',
            },
        )
        assert "embedded-image:3" in _error_text(result)
