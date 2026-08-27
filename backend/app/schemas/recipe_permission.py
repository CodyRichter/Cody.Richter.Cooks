"""
RecipePermission Pydantic schemas for API serialization and validation.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class PermissionRole(str, Enum):
    """Enumeration for recipe permission roles."""

    OWNER = "owner"
    EDITOR = "editor"


class RecipePermissionDetail(BaseModel):
    """Unified recipe permission schema with optional fields for different use cases."""

    # Core fields
    role: Optional[PermissionRole] = Field(
        None, description="Permission role for the user"
    )
    user_id: Optional[str] = Field(None, description="ID of user with permission")
    recipe_id: Optional[str] = Field(None, description="ID of recipe")

    # Response-only fields
    id: Optional[str] = Field(None, description="Permission ID")
    granted_at: Optional[datetime] = Field(
        None, description="When permission was granted"
    )

    # Extended fields for detailed responses
    user_username: Optional[str] = Field(
        None, description="Username of the user with permission"
    )
    user_email: Optional[str] = Field(
        None, description="Email of the user with permission"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "RP-12345-ABCDE",
                "role": "editor",
                "user_id": "U-98765-XYZWV",
                "recipe_id": "R-1GL2S-18XXB",
                "granted_at": "2026-01-15T12:00:00Z",
                "user_username": "sous_chef",
                "user_email": "souschef@example.com",
            }
        },
    )


class GrantPermissionRequest(BaseModel):
    """Schema for granting recipe permissions."""

    username: str = Field(..., description="Username of user to grant permission to")
    role: PermissionRole = Field(
        default=PermissionRole.EDITOR, description="Permission role to grant"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "sous_chef",
                "role": "editor",
            }
        }
    )


class RevokePermissionRequest(BaseModel):
    """Schema for revoking recipe permissions."""

    user_id: str = Field(..., description="ID of user to revoke permission from")

    model_config = ConfigDict(
        json_schema_extra={"example": {"user_id": "U-98765-XYZWV"}}
    )


class RecipePermissionList(BaseModel):
    permissions: List[RecipePermissionDetail]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "permissions": [
                    {
                        "id": "RP-12345-ABCDE",
                        "role": "editor",
                        "user_id": "U-98765-XYZWV",
                        "recipe_id": "R-1GL2S-18XXB",
                        "granted_at": "2026-01-15T12:00:00Z",
                        "user_username": "sous_chef",
                        "user_email": "souschef@example.com",
                    }
                ]
            }
        }
    )
