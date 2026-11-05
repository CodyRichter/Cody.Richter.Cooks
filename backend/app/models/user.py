"""
User model for authentication and user management.
"""

from typing import Optional

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Index,
    Boolean,
    Integer,
    LargeBinary,
)
from sqlalchemy.orm import deferred, relationship
from sqlalchemy.sql import func
from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator


class User(Base):
    """
    User model with authentication fields and relationships.

    Attributes:
        id: Primary key (secure string format)
        username: Unique username for login
        email: Unique email address
        password_hash: Hashed password for authentication
        is_admin: Whether the user is an administrator
        token_version: Embedded in JWTs; incrementing it revokes all issued tokens
        avatar_data: Raw profile picture bytes (deferred; loaded only when accessed)
        avatar_content_type: MIME type detected from the avatar's magic bytes
        avatar_updated_at: When the avatar was last set; null when there is no avatar
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """

    __tablename__ = "users"

    id = Column(String(15), primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False, server_default="false")
    token_version = Column(Integer, default=0, nullable=False, server_default="0")
    avatar_data = deferred(Column(LargeBinary, nullable=True))
    avatar_content_type = Column(String(50), nullable=True)
    avatar_updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    recipe_permissions = relationship(
        "RecipePermission",
        back_populates="user",
        foreign_keys="RecipePermission.user_id",
        cascade="all, delete-orphan",
    )
    api_tokens = relationship(
        "ApiToken", back_populates="user", cascade="all, delete-orphan"
    )

    # Database indices for optimized lookups
    __table_args__ = (
        Index("idx_user_username", "username"),
        Index("idx_user_email", "email"),
    )

    def __init__(self, **kwargs):
        """Initialize User with auto-generated secure ID if not provided."""
        if "id" not in kwargs:
            kwargs["id"] = SecureIDGenerator.generate_id("U")
        super().__init__(**kwargs)

    @property
    def avatar_url(self) -> Optional[str]:
        """Public, cache-busted avatar URL, or None when the user has no avatar."""
        if self.avatar_updated_at is None:
            return None
        version = int(self.avatar_updated_at.timestamp())
        return f"/api/v1/users/{self.id}/avatar?v={version}"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
