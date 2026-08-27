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
    change_password_internal,
    forgot_password_internal,
    reset_password_internal,
    verify_reset_token_internal,
)
from app.models.user import User
from app.schemas.auth import (
    AuthTokenResponse,
    AuthTokenRefreshRequest,
    AuthTokenRefreshResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import (
    UserCreateSchema,
    UserLogin,
    UserResponseSchema,
    UserSchema,
    UserChangePassword,
)
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post(
    "/register/",
    response_model=UserResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
    description="Create a new user account with a unique username, email address, and strong password. Use this tool when registering a new user before authenticating.",
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


@router.post(
    "/login/",
    response_model=AuthTokenResponse,
    summary="User login and JWT token generation",
    description="Authenticate with username/email and password to receive JWT access and refresh tokens along with user information. Use this tool to establish an authenticated session.",
)
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


@router.get(
    "/profile/",
    response_model=UserResponseSchema,
    summary="Get current user profile",
    description="Retrieve the profile details (ID, username, email, admin status, creation timestamp) of the currently authenticated user. Use this tool to verify authentication or retrieve user details.",
)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current user's profile information.

    Args:
        current_user: Current authenticated user

    Returns:
        User profile information
    """
    return get_user_profile_internal(current_user)


@router.put(
    "/profile/",
    response_model=UserResponseSchema,
    summary="Update current user profile",
    description="Update profile information such as username and email for the currently authenticated user. Use this tool when modifying account details.",
)
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


@router.post(
    "/change-password/",
    response_model=UserResponseSchema,
    summary="Change user password",
    description="Change the password of the currently authenticated user by validating current password and supplying a new strong password. Use this tool when the authenticated user requests a password change.",
)
async def change_password(
    change_password_data: UserChangePassword,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Change current user's password.

    Args:
        change_password_data: Password change data
        request: FastAPI request object for audit logging
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user profile information

    Raises:
        HTTPException: If current password is incorrect
    """
    return change_password_internal(change_password_data, request, current_user, db)


@router.post(
    "/refresh/",
    response_model=AuthTokenRefreshResponse,
    summary="Refresh JWT access token",
    description="Exchange a valid JWT refresh token for a fresh JWT access token. Use this tool to maintain an active session when the access token has expired without re-authenticating with credentials.",
)
async def refresh_token(
    refresh_data: AuthTokenRefreshRequest,
    request: Request,
    db: Session = Depends(get_db),
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


@router.post(
    "/forgot-password/",
    summary="Request password reset email",
    description="Initiate a password reset request for a given email address with captcha verification. Sends a password reset link to the email if the account exists.",
)
@router.post("/forgot-password", include_in_schema=False)
async def forgot_password(
    request_data: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Handle forgot password requests.
    Sends a password reset email if the user exists.
    Always returns a success message to prevent user enumeration.\n"""
    return await forgot_password_internal(request_data, request, db)


@router.post(
    "/reset-password/",
    summary="Reset password with token",
    description="Reset a user's password by submitting a valid password reset JWT token received via email and specifying a new strong password.",
)
@router.post("/reset-password", include_in_schema=False)
async def reset_password(
    request_data: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Handle password reset requests.
    Validates the token and updates the user's password.
    """
    return reset_password_internal(request_data, request, db)


@router.get(
    "/reset-password/verify/",
    summary="Verify password reset token",
    description="Verify the authenticity and validity of a password reset token and return the associated username. Use this tool before prompting the user for the new password.",
)
@router.get("/reset-password/verify", include_in_schema=False)
async def verify_reset_password_token(token: str, db: Session = Depends(get_db)):
    """
    Verify a password reset token and return user details (username).
    Used to pre-fill the reset form and satisfy password managers.
    """
    return verify_reset_token_internal(token, db)
