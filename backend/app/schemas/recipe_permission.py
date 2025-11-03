"""
RecipePermission Pydantic schemas for API serialization and validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class PermissionRole(str, Enum):
    """Enumeration for recipe permission roles."""
    OWNER = "owner"
    EDITOR = "editor"


class RecipePermissionDetail(BaseModel):
    """Unified recipe permission schema with optional fields for different use cases."""
    # Core fields
    role: Optional[PermissionRole] = Field(None, description="Permission role for the user")
    user_id: Optional[str] = Field(None, description="ID of user with permission")
    recipe_id: Optional[str] = Field(None, description="ID of recipe")
    
    # Response-only fields
    id: Optional[str] = Field(None, description="Permission ID")
    granted_at: Optional[datetime] = Field(None, description="When permission was granted")
    
    # Extended fields for detailed responses
    user_username: Optional[str] = Field(None, description="Username of the user with permission")
    user_email: Optional[str] = Field(None, description="Email of the user with permission")

    model_config = ConfigDict(from_attributes=True)


class GrantPermissionRequest(BaseModel):
    """Schema for granting recipe permissions."""
    username: str = Field(..., description="Username of user to grant permission to")
    role: PermissionRole = Field(default=PermissionRole.EDITOR, description="Permission role to grant")


class RevokePermissionRequest(BaseModel):
    """Schema for revoking recipe permissions."""
    user_id: str = Field(..., description="ID of user to revoke permission from")

class RecipePermissionList(BaseModel):
    permissions: list[RecipePermissionDetail]