from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserSchema


class AuthTokenResponse(BaseModel):
    """Schema for authentication token responses."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserSchema = Field(..., description="User information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "U-12345-ABCDE",
                    "username": "chef_cody",
                    "email": "cody@example.com",
                    "is_admin": False,
                },
            }
        }
    )


class AuthTokenRefreshRequest(BaseModel):
    """Schema for token refresh requests."""

    refresh_token: str = Field(..., description="JWT refresh token")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        }
    )


class AuthTokenRefreshResponse(BaseModel):
    """Schema for token refresh responses."""

    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password requests."""

    email: str = Field(..., description="User's email address")
    captcha_token: str = Field(..., description="Cloudflare Turnstile token")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "chef_cody@example.com",
                "captcha_token": "0.XXXXX-turnstile-token-XXXXX",
            }
        }
    )


class ResetPasswordRequest(BaseModel):
    """Schema for reset password requests."""

    token: str = Field(..., description="Password reset JWT token")
    new_password: str = Field(..., description="New password")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "new_password": "NewSecurePassword456!",
            }
        }
    )
