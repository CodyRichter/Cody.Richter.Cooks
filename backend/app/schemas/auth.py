from pydantic import BaseModel
from app.schemas.user import UserSchema
from pydantic import Field


class AuthTokenResponse(BaseModel):
    """Schema for authentication token responses."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserSchema = Field(..., description="User information")


class AuthTokenRefreshRequest(BaseModel):
    """Schema for token refresh requests."""

    refresh_token: str = Field(..., description="JWT refresh token")


class AuthTokenRefreshResponse(BaseModel):
    """Schema for token refresh responses."""

    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
