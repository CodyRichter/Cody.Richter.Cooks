"""
User API endpoints for registration, authentication, and profile management.
"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.handlers.users.impl_v1 import (
    get_user_profile_internal,
    login_user_internal,
    refresh_token_internal,
    register_user_internal,
    update_user_profile_internal,
)
from app.models.user import User
from app.schemas.user import (
    TokenRefreshRequest,
    TokenRefreshResponse,
    TokenResponse,
    UserCreateSchema,
    UserLogin,
    UserResponseSchema,
    UserSchema,
)
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post(
    "/register", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED
)
async def register_user(
    user_data: UserCreateSchema, request: Request, db: Session = Depends(get_db)
):
    """
    Register a new user account.

    Args:
        user_data: User registration data including username, email, and password
        request: FastAPI request object for audit logging
        db: Database session

    Returns:
        Created user information (excluding password)

    Raises:
        HTTPException: If username or email already exists
    """
    return register_user_internal(user_data, request, db)


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLogin, request: Request, db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    Args:
        login_data: User login credentials (username and password)
        request: FastAPI request object for audit logging
        db: Database session

    Returns:
        JWT access token and user information

    Raises:
        HTTPException: If credentials are invalid
    """
    return login_user_internal(login_data, request, db)


@router.get("/profile", response_model=UserResponseSchema)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user's profile information.

    Args:
        current_user: Current authenticated user

    Returns:
        User profile information
    """
    return get_user_profile_internal(current_user)


@router.put("/profile", response_model=UserResponseSchema)
async def update_user_profile(
    profile_data: UserSchema,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile information.

    Args:
        profile_data: Updated profile data
        request: FastAPI request object for audit logging
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile information

    Raises:
        HTTPException: If username or email already exists for another user
    """
    return update_user_profile_internal(profile_data, request, current_user, db)


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    refresh_data: TokenRefreshRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.

    Args:
        refresh_data: Refresh token data
        request: FastAPI request object for audit logging
        db: Database session

    Returns:
        New access token

    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    return refresh_token_internal(refresh_data, request, db)
