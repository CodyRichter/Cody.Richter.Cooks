"""
Personal API token model for scoped, non-browser access (e.g. the MCP server).
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator


class ApiToken(Base):
    """
    A long-lived bearer token limited to a set of scopes.

    Only the SHA-256 hash of the token is stored; the plaintext is shown once at
    creation. Tokens are accepted by the MCP endpoint only, never by REST routes.
    """

    __tablename__ = "api_tokens"

    id = Column(String(15), primary_key=True, index=True)
    user_id = Column(
        String(15),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    token_prefix = Column(String(12), nullable=False)
    scopes = Column(JSON, nullable=False, default=list)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="api_tokens")

    def __init__(self, **kwargs):
        """Initialize ApiToken with auto-generated secure ID if not provided."""
        if "id" not in kwargs:
            kwargs["id"] = SecureIDGenerator.generate_id("AT")
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<ApiToken(id={self.id}, user_id={self.user_id}, name='{self.name}')>"
