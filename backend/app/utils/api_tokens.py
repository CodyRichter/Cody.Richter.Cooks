"""
Personal API token generation and resolution.
"""

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.api_token import ApiToken
from app.models.user import User

TOKEN_PREFIX = "crc_"

SCOPE_RECIPES_READ = "recipes:read"
SCOPE_RECIPES_WRITE = "recipes:write"
AVAILABLE_SCOPES = (SCOPE_RECIPES_READ, SCOPE_RECIPES_WRITE)


def generate_api_token() -> str:
    return TOKEN_PREFIX + secrets.token_urlsafe(32)


def hash_api_token(token: str) -> str:
    """SHA-256 is sufficient: tokens carry 256 bits of entropy, unlike passwords."""
    return hashlib.sha256(token.encode()).hexdigest()


def resolve_api_token(db: Session, token: str) -> Optional[tuple[User, ApiToken]]:
    """
    Return the owner and token row for a live API token, recording its use.

    Returns None for unknown, revoked, or expired tokens.
    """
    if not token.startswith(TOKEN_PREFIX):
        return None

    api_token = (
        db.query(ApiToken).filter(ApiToken.token_hash == hash_api_token(token)).first()
    )
    if api_token is None or api_token.revoked_at is not None:
        return None

    now = datetime.now(timezone.utc)
    if api_token.expires_at is not None and api_token.expires_at <= now:
        return None

    api_token.last_used_at = now
    db.commit()
    return api_token.user, api_token
