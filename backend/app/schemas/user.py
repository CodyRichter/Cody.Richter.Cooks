"""
User Pydantic schemas for API serialization and validation.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class UserSchema(BaseModel):
    """Unified user schema with optional fields for different use cases."""

    # Core fields
    username: Optional[str] = Field(
        None, min_length=3, max_length=50, description="Username for login"
    )
    email: Optional[str] = Field(None, description="User email address")
    password: Optional[str] = Field(
        None, min_length=8, max_length=128, description="User password"
    )
    is_admin: Optional[bool] = Field(False, description="Whether the user is an admin")

    # Response-only fields
    id: Optional[str] = Field(None, description="User ID")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "U-12345-ABCDE",
                "username": "chef_cody",
                "email": "cody@example.com",
                "is_admin": False,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-01T00:00:00Z",
            }
        },
    )


class UserCreateSchema(BaseModel):
    """Schema specifically for user creation with required fields."""

    username: str = Field(
        ..., min_length=3, max_length=50, description="Username for login"
    )
    email: str = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=8, max_length=128, description="User password"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "chef_cody",
                "email": "cody@example.com",
                "password": "SuperSecretPassword123!",
            }
        }
    )


class UserUpdateSchema(UserCreateSchema):
    """Schema for updating user information."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "chef_cody_updated",
                "email": "cody_new@example.com",
                "password": "NewSecretPassword456!",
            }
        }
    )


class UserResponseSchema(BaseModel):
    """Schema for user API responses (excludes sensitive data)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "U-12345-ABCDE",
                "username": "chef_cody",
                "email": "cody@example.com",
                "is_admin": False,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-01T00:00:00Z",
            }
        },
    )

    id: str
    username: str
    email: str
    is_admin: bool
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    """Schema for user login requests."""

    username: str = Field(..., description="Username or email for login")
    password: str = Field(..., description="User password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "chef_cody",
                "password": "SuperSecretPassword123!",
            }
        }
    )


class UserChangePassword(BaseModel):
    """Schema for password change requests."""

    current_password: str = Field(..., description="Current user password")
    new_password: str = Field(
        ..., min_length=8, max_length=128, description="New user password"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "SuperSecretPassword123!",
                "new_password": "BrandNewPassword789!",
            }
        }
    )
