"""
User model for authentication and user management.
"""

from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator

if TYPE_CHECKING:
    pass


class User(Base):
    """
    User model with authentication fields and relationships.

    Attributes:
        id: Primary key (secure string format)
        username: Unique username for login
        email: Unique email address
        password_hash: Hashed password for authentication
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """

    __tablename__ = "users"

    id = Column(String(15), primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
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

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
