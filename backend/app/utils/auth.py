"""
Authentication utilities for password hashing, JWT token management, and user authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, TYPE_CHECKING

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.utils.password_security import PasswordSecurity

if TYPE_CHECKING:
    from app.models.user import User

# JWT token security scheme
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with optional expiration time.

    Args:
        data: Dictionary of data to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token with optional expiration time.

    Args:
        data: Dictionary of data to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string to verify

    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT refresh token.

    Args:
        token: JWT refresh token string to verify

    Returns:
        Decoded token payload if valid and is a refresh token, None if invalid
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        # Ensure this is a refresh token
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def authenticate_user(db: Session, username: str, password: str) -> Optional["User"]:
    """
    Authenticate a user by username and password.

    Args:
        db: Database session
        username: Username to authenticate
        password: Plain text password

    Returns:
        User object if authentication successful, None otherwise
    """
    from app.models.user import User

    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not PasswordSecurity.verify_password(password, user.password_hash):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> "User":
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        credentials: HTTP authorization credentials containing the JWT token
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception

        # Ensure this is an access token (not a refresh token)
        if payload.get("type") != "access":
            raise credentials_exception

        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    from app.models.user import User

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user


def refresh_access_token(refresh_token: str, db: Session) -> Optional[str]:
    """
    Create a new access token from a valid refresh token.

    Args:
        refresh_token: JWT refresh token string
        db: Database session

    Returns:
        New access token if refresh token is valid, None otherwise
    """
    payload = verify_refresh_token(refresh_token)
    if payload is None:
        return None

    username: str = payload.get("sub")
    if username is None:
        return None

    from app.models.user import User

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        return None

    # Create new access token
    access_token = create_access_token(data={"sub": user.username})
    return access_token


def get_current_active_user(current_user: "User" = Depends(get_current_user)) -> "User":
    """
    Dependency to get the current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        Current active user

    Raises:
        HTTPException: If user is inactive (if we add user status in the future)
    """
    # For now, all users are considered active
    # This can be extended to check user.is_active if we add that field
    return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(get_db),
) -> Optional["User"]:
    """
    Dependency to get the current authenticated user from JWT token if available.
    Does not raise exception if token is missing or invalid.

    Args:
        credentials: HTTP authorization credentials containing the JWT token
        db: Database session

    Returns:
        Current authenticated user if token is valid, None otherwise
    """
    if credentials is None:
        return None

    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            return None

        # Ensure this is an access token (not a refresh token)
        if payload.get("type") != "access":
            return None

        username: str = payload.get("sub")
        if username is None:
            return None

    except JWTError:
        return None

    from app.models.user import User

    user = db.query(User).filter(User.username == username).first()
    return user


def create_password_reset_token(user_id: str, password_hash: str) -> str:
    """
    Create a stateless JWT token for password reset.
    The token encodes the current password_hash so it is instantly invalidated
    if the password is changed.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": user_id, "hash": password_hash, "exp": expire, "type": "reset"}
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[dict]:
    """
    Verify and decode a password reset token.
    Returns the payload if valid and type is 'reset', None otherwise.
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "reset":
            return None
        return payload
    except JWTError:
        return None
