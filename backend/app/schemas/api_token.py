"""
Personal API token Pydantic schemas.
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ApiTokenScope = Literal["recipes:read", "recipes:write"]


class ApiTokenCreate(BaseModel):
    """Request body for creating a personal API token."""

    name: str = Field(
        ..., min_length=1, max_length=100, description="Label, e.g. 'Claude Code'"
    )
    scopes: List[ApiTokenScope] = Field(
        default_factory=lambda: ["recipes:read", "recipes:write"],
        min_length=1,
        description="Scopes granted to the token",
    )
    expires_in_days: Optional[int] = Field(
        None, ge=1, le=365, description="Days until expiry; omit for no expiry"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Claude Code",
                "scopes": ["recipes:read", "recipes:write"],
                "expires_in_days": 90,
            }
        }
    )


class ApiTokenDetail(BaseModel):
    """A personal API token as listed to its owner (never includes the secret)."""

    id: str
    name: str
    token_prefix: str
    scopes: List[ApiTokenScope]
    created_at: datetime
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    revoked_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ApiTokenCreated(ApiTokenDetail):
    """Creation response; `token` is shown once and cannot be retrieved again."""

    token: str
