"""
User Pydantic schemas for API serialization and validation.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class UserSchema(BaseModel):
    """Unified user schema with optional fields for different use cases."""
    # Core fields
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username for login")
    email: Optional[str] = Field(None, description="User email address")
    password: Optional[str] = Field(None, min_length=8, max_length=128, description="User password")
    
    # Response-only fields
    id: Optional[str] = Field(None, description="User ID")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class UserCreateSchema(BaseModel):
    """Schema specifically for user creation with required fields."""
    username: str = Field(..., min_length=3, max_length=50, description="Username for login")
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")

class UserUpdateSchema(UserCreateSchema):
    """Schema for updating user information."""
    pass


class UserResponseSchema(BaseModel):
    """Schema for user API responses (excludes sensitive data)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    username: str
    email: str
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    """Schema for user login requests."""
    username: str = Field(..., description="Username or email for login")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Schema for authentication token responses."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserSchema = Field(..., description="User information")


class TokenRefreshRequest(BaseModel):
    """Schema for token refresh requests."""
    refresh_token: str = Field(..., description="JWT refresh token")


class TokenRefreshResponse(BaseModel):
    """Schema for token refresh responses."""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
