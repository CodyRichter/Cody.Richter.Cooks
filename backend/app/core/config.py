"""
Application configuration management using Pydantic settings.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application settings
    app_name: str = "Cody Richter Cooks API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database settings
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # CORS settings
    cors_origins: str = (
        "https://cooking.cody.richter.codes,http://localhost:3000,http://127.0.0.1:3000"
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    @property
    def cors_origins_list(self) -> list[str]:
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
    secret_key: str = "insecure-default-secret-key-for-development-only-12345"
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

    # External Integrations
    frontend_url: str = "http://localhost:3000"
    resend_api_key: str = ""
    email_from_address: str = "noreply@cooking.cody.richter.codes"
    turnstile_secret_key: str = (
        "1x0000000000000000000000000000000AA"  # Default test key
    )

    model_config = {"env_file": ".env", "case_sensitive": False}


# Global settings instance
settings = Settings()
