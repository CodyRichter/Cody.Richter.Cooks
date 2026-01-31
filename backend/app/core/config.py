"""
Application configuration management using Pydantic settings.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application settings
    app_name: str = "Cody Richter Cooks API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database settings
    # Database settings
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    # CORS settings
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins string or JSON list to list."""
        if not self.cors_origins:
            return []

        # Handle JSON format like ["http://..."]
        if self.cors_origins.startswith("[") and self.cors_origins.endswith("]"):
            try:
                import json

                return json.loads(self.cors_origins)
            except Exception:
                pass

        # Handle comma-separated format
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Security settings
    # CRITICAL: SECRET_KEY must be set via environment variable
    # No default value for security - application will fail if not configured
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15  # Shorter expiration for enhanced security
    refresh_token_expire_days: int = 7  # Refresh token expires in 7 days

    # Password Settings
    bcrypt_rounds: int = 12
    password_min_length: int = 8
    password_max_length: int = 128
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digits: bool = True
    password_require_special: bool = True

    max_recipes_per_page: int = 20

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate that SECRET_KEY is properly configured for production."""
        if not v:
            raise ValueError("SECRET_KEY is required and cannot be empty")

        # Minimum length requirement for security (64 characters = 256 bits when hex)
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long. "
                "Generate a secure key with: python -c 'import secrets; print(secrets.token_hex(32))'"
            )

        # Warn if using common placeholder values
        insecure_patterns = [
            "your-secret",
            "change-this",
            "default",
            "secret-key",
            "mysecret",
        ]
        v_lower = v.lower()
        for pattern in insecure_patterns:
            if pattern in v_lower:
                raise ValueError(
                    f"SECRET_KEY appears to contain insecure placeholder text: '{pattern}'. "
                    "Please use a cryptographically secure random key."
                )

        return v

    model_config = {"env_file": ".env", "case_sensitive": False}


# Global settings instance
settings = Settings()
