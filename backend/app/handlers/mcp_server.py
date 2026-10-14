"""
MCP server exposing a deliberately small recipe toolset to AI clients.

Authenticated with personal API tokens (see app/utils/api_tokens.py); those
tokens are accepted here and nowhere else. Tools reuse the recipe handler
implementations, so permissions and validation match the REST API.
"""

import re
from contextlib import asynccontextmanager, contextmanager
from typing import Annotated, AsyncIterator, Iterator, List, Optional

import anyio
from fastapi import HTTPException
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.auth.provider import AccessToken
from mcp.server.auth.settings import AuthSettings
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session
from starlette.applications import Starlette
from starlette.types import Receive, Scope, Send

from app.core.config import settings
from app.core.database import SessionLocal
from app.handlers.recipes.impl_v1 import (
    create_recipe_internal,
    get_recipe_internal,
    list_recipes_internal,
    update_recipe_internal,
)
from app.models.recipe_permission import PermissionRole
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeDetail, RecipeList
from app.utils.api_tokens import (
    SCOPE_RECIPES_READ,
    SCOPE_RECIPES_WRITE,
    resolve_api_token,
)

SERVER_INSTRUCTIONS = """\
Tools for adding and editing recipes on Cody Richter Cooks.

- Before create_recipe, call search_recipes to avoid duplicates. Before update_recipe, call get_recipe.
- Descriptions are HTML limited to: p, br, strong, em, u, s, ul, ol, li, h2-h4, blockquote, a, img. Anything else is stripped.
- List ingredients and instructions in order; ordering is assigned from list position.
- Every ingredient needs a numeric quantity and a unit. For "to taste" items use a sensible amount (e.g. 1 pinch) and put "to taste" in subtext.
- Times are whole minutes. Tags are short lowercase words (e.g. "dinner", "vegetarian").
- Embedded images appear as src="embedded-image:N". Keep those placeholders unchanged to preserve the images.
"""

_EMBEDDED_IMAGE_SRC = re.compile(r'(<img\b[^>]*?\bsrc=")(data:[^"]*)(")', re.IGNORECASE)
_IMAGE_PLACEHOLDER_SRC = re.compile(
    r'(<img\b[^>]*?\bsrc=")embedded-image:(\d+)(")', re.IGNORECASE
)


class ApiTokenVerifier:
    """Resolves bearer tokens against stored personal API tokens."""

    async def verify_token(self, token: str) -> Optional[AccessToken]:
        return await anyio.to_thread.run_sync(self._verify, token)

    @staticmethod
    def _verify(token: str) -> Optional[AccessToken]:
        db = SessionLocal()
        try:
            resolved = resolve_api_token(db, token)
            if resolved is None:
                return None
            user, api_token = resolved
            return AccessToken(
                token=token,
                client_id=api_token.id,
                subject=user.id,
                scopes=list(api_token.scopes),
                expires_at=int(api_token.expires_at.timestamp())
                if api_token.expires_at
                else None,
            )
        finally:
            db.close()


class IngredientInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Guanciale"])
    quantity: float = Field(..., ge=0, examples=[150])
    unit: str = Field(..., min_length=1, max_length=50, examples=["g", "cups", "whole"])
    subtext: Optional[str] = Field(
        None, max_length=255, description="Prep notes", examples=["diced"]
    )


class InstructionInput(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, examples=["Boil Pasta"])
    description: str = Field(..., min_length=1, description="HTML body of the step")
    timing: Optional[int] = Field(None, ge=1, description="Minutes this step takes")


mcp_server = MCPServer(
    name="cody-richter-cooks",
    title="Cody Richter Cooks",
    instructions=SERVER_INSTRUCTIONS,
    version=settings.app_version,
    token_verifier=ApiTokenVerifier(),
    auth=AuthSettings(issuer_url=settings.api_public_url, resource_server_url=None),
)


@contextmanager
def _authorized_session(scope: str) -> Iterator[tuple[Session, User]]:
    """Open a DB session for the token's owner, mapping API errors to tool errors."""
    access_token = get_access_token()
    if access_token is None or scope not in access_token.scopes:
        raise ToolError(f"This API token does not have the '{scope}' scope.")

    db = SessionLocal()
    try:
        user = db.get(User, access_token.subject)
        if user is None:
            raise ToolError("The owner of this API token no longer exists.")
        yield db, user
    except HTTPException as exc:
        db.rollback()
        raise ToolError(str(exc.detail)) from exc
    except ValidationError as exc:
        db.rollback()
        raise ToolError(str(exc)) from exc
    finally:
        db.close()


def _html_fields_in_order(recipe: RecipeDetail) -> list[str]:
    steps = sorted(recipe.instructions, key=lambda step: step.step_number or 0)
    return [recipe.description or ""] + [step.description or "" for step in steps]


def _hide_embedded_images(recipe: RecipeDetail) -> RecipeDetail:
    """Swap inline data: images for numbered placeholders to keep tool output small."""
    counter = 0

    def placeholder(match: re.Match) -> str:
        nonlocal counter
        counter += 1
        return f"{match.group(1)}embedded-image:{counter}{match.group(3)}"

    description = _EMBEDDED_IMAGE_SRC.sub(placeholder, recipe.description or "")
    instructions = [
        step.model_copy(
            update={
                "description": _EMBEDDED_IMAGE_SRC.sub(
                    placeholder, step.description or ""
                )
            }
        )
        for step in sorted(recipe.instructions, key=lambda step: step.step_number or 0)
    ]
    return recipe.model_copy(
        update={"description": description, "instructions": instructions}
    )


def _restore_embedded_images(html: str, images: list[str]) -> str:
    def original(match: re.Match) -> str:
        index = int(match.group(2)) - 1
        if not 0 <= index < len(images):
            raise ToolError(
                f"embedded-image:{index + 1} does not exist on this recipe. "
                "Call get_recipe for the current placeholders."
            )
        return f"{match.group(1)}{images[index]}{match.group(3)}"

    return _IMAGE_PLACEHOLDER_SRC.sub(original, html)


def _stored_images(recipe: RecipeDetail) -> list[str]:
    return [
        match.group(2)
        for html in _html_fields_in_order(recipe)
        for match in _EMBEDDED_IMAGE_SRC.finditer(html)
    ]


def _ingredient_payload(ingredients: List[IngredientInput]) -> list[dict]:
    return [
        {**ingredient.model_dump(), "order_index": index}
        for index, ingredient in enumerate(ingredients)
    ]


def _instruction_payload(
    instructions: List[InstructionInput], images: list[str]
) -> list[dict]:
    return [
        {
            **step.model_dump(),
            "description": _restore_embedded_images(step.description, images),
            "step_number": index + 1,
        }
        for index, step in enumerate(instructions)
    ]


@mcp_server.tool(annotations=ToolAnnotations(read_only_hint=True))
def search_recipes(
    query: Annotated[str, Field(description="Words to match against recipe titles")],
    page: Annotated[int, Field(ge=1)] = 1,
) -> RecipeList:
    """Search all public recipes by title. Use before create_recipe to check for duplicates."""
    with _authorized_session(SCOPE_RECIPES_READ) as (db, _):
        return list_recipes_internal(
            db=db, title_search_query=query, page=page, limit=20
        )


@mcp_server.tool(annotations=ToolAnnotations(read_only_hint=True))
def list_my_recipes(page: Annotated[int, Field(ge=1)] = 1) -> RecipeList:
    """List recipes the token owner can edit (as owner or editor), newest first."""
    with _authorized_session(SCOPE_RECIPES_READ) as (db, user):
        return list_recipes_internal(
            db=db,
            user_id_filter=user.id,
            user_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
            page=page,
            limit=20,
        )


@mcp_server.tool(annotations=ToolAnnotations(read_only_hint=True))
def get_recipe(
    recipe_id: Annotated[str, Field(examples=["R-1GL2S-18XXB"])],
) -> RecipeDetail:
    """Get a recipe with its ingredients and ordered instructions."""
    with _authorized_session(SCOPE_RECIPES_READ) as (db, _):
        return _hide_embedded_images(get_recipe_internal(recipe_id, db))


@mcp_server.tool(
    annotations=ToolAnnotations(destructive_hint=False, idempotent_hint=False)
)
def create_recipe(
    title: Annotated[str, Field(min_length=1, max_length=255)],
    description: Annotated[str, Field(description="HTML introduction to the dish")],
    ingredients: Annotated[
        List[IngredientInput], Field(description="In display order")
    ],
    instructions: Annotated[
        List[InstructionInput], Field(description="In cooking order")
    ],
    tags: Annotated[
        Optional[List[str]], Field(description="Short lowercase tags")
    ] = None,
    cooking_time: Annotated[
        Optional[int], Field(ge=1, description="Total minutes")
    ] = None,
    serving_size: Annotated[Optional[int], Field(ge=1)] = None,
) -> RecipeDetail:
    """Create a new recipe owned by the token owner. Returns the saved recipe, including its ID."""
    with _authorized_session(SCOPE_RECIPES_WRITE) as (db, user):
        recipe_data = RecipeCreate(
            title=title,
            description=description,
            tags=tags or [],
            cooking_time=cooking_time,
            serving_size=serving_size,
            ingredients=_ingredient_payload(ingredients),
            instructions=_instruction_payload(instructions, images=[]),
        )
        return _hide_embedded_images(create_recipe_internal(recipe_data, user, db))


@mcp_server.tool(
    annotations=ToolAnnotations(destructive_hint=True, idempotent_hint=True)
)
def update_recipe(
    recipe_id: str,
    title: Annotated[Optional[str], Field(min_length=1, max_length=255)] = None,
    description: Annotated[
        Optional[str], Field(description="HTML introduction")
    ] = None,
    tags: Optional[List[str]] = None,
    cooking_time: Annotated[Optional[int], Field(ge=1)] = None,
    serving_size: Annotated[Optional[int], Field(ge=1)] = None,
    ingredients: Annotated[
        Optional[List[IngredientInput]],
        Field(description="If given, replaces ALL ingredients"),
    ] = None,
    instructions: Annotated[
        Optional[List[InstructionInput]],
        Field(description="If given, replaces ALL instructions"),
    ] = None,
) -> RecipeDetail:
    """Update a recipe the token owner owns or edits. Only the fields you pass change.

    Passing ingredients or instructions replaces that whole list, so send the
    complete list (call get_recipe first).
    """
    with _authorized_session(SCOPE_RECIPES_WRITE) as (db, user):
        images = _stored_images(get_recipe_internal(recipe_id, db))
        changes = {
            "title": title,
            "description": _restore_embedded_images(description, images)
            if description is not None
            else None,
            "tags": tags,
            "cooking_time": cooking_time,
            "serving_size": serving_size,
            "ingredients": _ingredient_payload(ingredients)
            if ingredients is not None
            else None,
            "instructions": _instruction_payload(instructions, images)
            if instructions is not None
            else None,
        }
        recipe_data = RecipeDetail.model_validate(
            {field: value for field, value in changes.items() if value is not None}
        )
        return _hide_embedded_images(
            update_recipe_internal(recipe_id, recipe_data, user, db)
        )


class McpApp:
    """
    ASGI route target for /mcp.

    A session manager can only run once, so each application lifespan builds a
    fresh Streamable HTTP app. The app is stateless so any Cloud Run instance can
    serve any request, and DNS rebinding protection is off because auth is an
    explicit bearer token, not an ambient cookie a rebinding page could ride on.
    """

    def __init__(self) -> None:
        self._app: Optional[Starlette] = None

    @asynccontextmanager
    async def lifespan(self) -> AsyncIterator[None]:
        self._app = mcp_server.streamable_http_app(
            streamable_http_path="/mcp",
            stateless_http=True,
            json_response=True,
            transport_security=TransportSecuritySettings(
                enable_dns_rebinding_protection=False
            ),
        )
        try:
            async with mcp_server.session_manager.run():
                yield
        finally:
            self._app = None

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if self._app is None:
            raise RuntimeError("The MCP app is only available inside the app lifespan")
        await self._app(scope, receive, send)


mcp_app = McpApp()
