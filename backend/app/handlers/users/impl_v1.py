from datetime import datetime, timedelta, timezone

import hashlib

from fastapi import HTTPException, Request, Response, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.api_token import ApiToken
from app.models.security_audit_log import SecurityEventType
from app.models.user import User
from app.schemas.api_token import ApiTokenCreate, ApiTokenCreated, ApiTokenDetail
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
    UserProfileUpdate,
    UserChangePassword,
)
from app.utils.api_tokens import generate_api_token, hash_api_token
from app.utils.audit_logger import get_audit_logger
from app.utils.avatar import (
    MAX_AVATAR_BYTES,
    InvalidAvatarError,
    normalize_avatar,
    sniff_image_type,
)
from app.utils.auth import (
    authenticate_user,
    create_token_pair,
    revoke_user_tokens,
    rotate_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.utils.captcha import verify_turnstile_token
from app.utils.email import EmailService
from app.utils.password_security import PasswordSecurity
from app.core.config import settings


def register_user_internal(
    user_data: UserCreateSchema, request: Request, db: Session
) -> UserResponseSchema:
    audit_logger = get_audit_logger(db)

    if not verify_turnstile_token(user_data.captcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid captcha token"
        )

    try:
        # Check if username already exists (case-insensitive)
        existing_user = (
            db.query(User)
            .filter(func.lower(User.username) == func.lower(user_data.username))
            .first()
        )
        if existing_user:
            # Log failed registration attempt
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.REGISTRATION_FAILED,
                request=request,
                username=user_data.username,
                success=False,
                failure_reason="Username already registered",
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )

        # Check if email already exists (case-insensitive)
        existing_email = (
            db.query(User)
            .filter(func.lower(User.email) == func.lower(user_data.email))
            .first()
        )
        if existing_email:
            # Log failed registration attempt
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.REGISTRATION_FAILED,
                request=request,
                username=user_data.username,
                success=False,
                failure_reason="Email already registered",
                additional_details={"email": user_data.email},
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Validate password strength
        try:
            PasswordSecurity.validate_password_strength_strict(user_data.password)
        except HTTPException as e:
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.REGISTRATION_FAILED,
                request=request,
                username=user_data.username,
                success=False,
                failure_reason="Password does not meet security requirements",
                additional_details={"validation_error": str(e.detail)},
            )
            raise

        # Hash the password
        hashed_password = PasswordSecurity.hash_password(user_data.password)

        # Create new user
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Log successful registration
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.REGISTRATION_SUCCESS,
            request=request,
            user=db_user,
            success=True,
            additional_details={"email": db_user.email},
        )

        return UserResponseSchema.model_validate(db_user)

    except IntegrityError:
        db.rollback()
        # Log failed registration attempt due to database constraint
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.REGISTRATION_FAILED,
            request=request,
            username=user_data.username,
            success=False,
            failure_reason="Username or email already exists (database constraint)",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )


def login_user_internal(
    login_data: UserLogin, request: Request, db: Session
) -> AuthTokenResponse:
    audit_logger = get_audit_logger(db)

    # Try to authenticate with username first
    user = authenticate_user(db, login_data.username, login_data.password)

    # If username authentication fails, try with email
    if not user:
        user_by_email = (
            db.query(User)
            .filter(func.lower(User.email) == func.lower(login_data.username))
            .first()
        )
        if user_by_email:
            user = authenticate_user(db, user_by_email.username, login_data.password)

    if not user:
        # Log failed login attempt
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.LOGIN_FAILED,
            request=request,
            username=login_data.username,
            success=False,
            failure_reason="Invalid credentials",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access and refresh tokens
    access_token, refresh_token = create_token_pair(user)

    # Log successful login
    audit_logger.log_authentication_event(
        event_type=SecurityEventType.LOGIN_SUCCESS,
        request=request,
        user=user,
        success=True,
        additional_details={
            "login_method": "email" if "@" in login_data.username else "username"
        },
    )

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponseSchema.model_validate(user),
    )


def get_user_profile_internal(current_user: User) -> UserResponseSchema:
    return UserResponseSchema.model_validate(current_user)


def update_user_profile_internal(
    profile_data: UserProfileUpdate, request: Request, current_user: User, db: Session
) -> UserResponseSchema:
    audit_logger = get_audit_logger(db)
    changes = {}

    # Check if username is being updated and if it already exists (case-insensitive)
    if profile_data.username and profile_data.username != current_user.username:
        existing_user = (
            db.query(User)
            .filter(
                func.lower(User.username) == func.lower(profile_data.username),
                User.id != current_user.id,
            )
            .first()
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )
        changes["username"] = {
            "old": current_user.username,
            "new": profile_data.username,
        }
        current_user.username = profile_data.username

    # Check if email is being updated and if it already exists (case-insensitive)
    if profile_data.email and profile_data.email != current_user.email:
        # The email controls password resets, so changing it requires re-authentication
        if not PasswordSecurity.verify_password(
            profile_data.current_password or "", current_user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to change email",
            )
        existing_email = (
            db.query(User)
            .filter(
                func.lower(User.email) == func.lower(profile_data.email),
                User.id != current_user.id,
            )
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken"
            )
        changes["email"] = {"old": current_user.email, "new": profile_data.email}
        current_user.email = profile_data.email

    try:
        db.commit()
        db.refresh(current_user)

        # Log profile update event
        if changes:
            audit_logger.log_event(
                event_type=SecurityEventType.PROFILE_UPDATED,
                request=request,
                user=current_user,
                success=True,
                details={"changes": changes},
            )

        return UserResponseSchema.model_validate(current_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )


def change_password_internal(
    change_password_data: UserChangePassword,
    request: Request,
    current_user: User,
    db: Session,
) -> AuthTokenResponse:
    audit_logger = get_audit_logger(db)

    # Validate current password
    if not PasswordSecurity.verify_password(
        change_password_data.current_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password provided is incorrect",
        )

    # Validate new password strength
    PasswordSecurity.validate_password_strength_strict(
        change_password_data.new_password
    )
    current_user.password_hash = PasswordSecurity.hash_password(
        change_password_data.new_password
    )
    revoke_user_tokens(current_user)

    try:
        db.commit()
        db.refresh(current_user)

        # Log password change event
        audit_logger.log_event(
            event_type=SecurityEventType.PASSWORD_CHANGED,
            request=request,
            user=current_user,
            success=True,
            details={"changed_via": "profile_update"},
        )

        # Other sessions were revoked; keep this one signed in with fresh tokens
        access_token, refresh_token = create_token_pair(current_user)
        return AuthTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponseSchema.model_validate(current_user),
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to change password. Internal error.",
        )


def refresh_token_internal(
    refresh_data: AuthTokenRefreshRequest, request: Request, db: Session
) -> AuthTokenRefreshResponse:
    audit_logger = get_audit_logger(db)

    rotated = rotate_refresh_token(refresh_data.refresh_token, db)
    if rotated is None:
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.TOKEN_REFRESH_FAILED,
            request=request,
            success=False,
            failure_reason="Invalid, expired, or revoked refresh token",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user, access_token, refresh_token = rotated
    audit_logger.log_authentication_event(
        event_type=SecurityEventType.TOKEN_REFRESH,
        request=request,
        user=user,
        success=True,
    )

    return AuthTokenRefreshResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer"
    )


def logout_all_sessions_internal(
    request: Request, current_user: User, db: Session
) -> None:
    revoke_user_tokens(current_user)
    db.commit()

    get_audit_logger(db).log_event(
        event_type=SecurityEventType.LOGOUT,
        request=request,
        user=current_user,
        success=True,
        details={"scope": "all_sessions"},
    )


def forgot_password_internal(
    request_data: ForgotPasswordRequest, request: Request, db: Session
) -> dict:
    audit_logger = get_audit_logger(db)

    # 1. Verify captcha
    is_valid_captcha = verify_turnstile_token(request_data.captcha_token)
    if not is_valid_captcha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid captcha token"
        )

    # 2. Look up user
    user = (
        db.query(User)
        .filter(func.lower(User.email) == func.lower(request_data.email))
        .first()
    )

    if user:
        # 3. Create token
        token = create_password_reset_token(user.id, user.password_hash)
        reset_link = f"{settings.frontend_url}/auth/reset-password?token={token}"

        # 4. Send email
        EmailService.send_password_reset_email(user.email, reset_link)

        audit_logger.log_event(
            event_type=SecurityEventType.PASSWORD_CHANGED,  # Maybe better to have a generic event
            request=request,
            user=user,
            success=True,
            details={"action": "password_reset_requested"},
        )
    else:
        # Don't log missing user emails directly for privacy, or log generically
        pass

    # Always return success message to avoid enumeration
    return {
        "message": "If an account with that email exists, we have sent a password reset link."
    }


def reset_password_internal(
    request_data: ResetPasswordRequest, request: Request, db: Session
) -> dict:
    audit_logger = get_audit_logger(db)

    # 1. Verify token
    payload = verify_password_reset_token(request_data.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user_id = payload.get("sub")
    token_hash = payload.get("hash")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    # 2. Check if token was already used (hash mismatch)
    if user.password_hash != token_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    # 3. Validate new password strength
    PasswordSecurity.validate_password_strength_strict(request_data.new_password)

    # 4. Hash and update, signing out every existing session
    user.password_hash = PasswordSecurity.hash_password(request_data.new_password)
    revoke_user_tokens(user)

    try:
        db.commit()
        db.refresh(user)

        audit_logger.log_event(
            event_type=SecurityEventType.PASSWORD_CHANGED,
            request=request,
            user=user,
            success=True,
            details={"changed_via": "password_reset_flow"},
        )
        return {"message": "Password has been reset successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to change password. Internal error.",
        )


def verify_reset_token_internal(token: str, db: Session) -> dict:
    """
    Verifies a password reset token and returns the associated username.
    """
    payload = verify_password_reset_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user_id = payload.get("sub")
    token_hash = payload.get("hash")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.password_hash != token_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    return {"username": user.username}


def create_api_token_internal(
    token_data: ApiTokenCreate, request: Request, current_user: User, db: Session
) -> ApiTokenCreated:
    token = generate_api_token()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=token_data.expires_in_days)
        if token_data.expires_in_days
        else None
    )
    api_token = ApiToken(
        user_id=current_user.id,
        name=token_data.name,
        token_hash=hash_api_token(token),
        token_prefix=token[:12],
        scopes=list(dict.fromkeys(token_data.scopes)),
        expires_at=expires_at,
    )
    db.add(api_token)
    db.commit()
    db.refresh(api_token)

    get_audit_logger(db).log_event(
        event_type=SecurityEventType.API_TOKEN_CREATED,
        request=request,
        user=current_user,
        success=True,
        details={"token_id": api_token.id, "scopes": api_token.scopes},
    )

    return ApiTokenCreated(
        **ApiTokenDetail.model_validate(api_token).model_dump(), token=token
    )


def list_api_tokens_internal(current_user: User, db: Session) -> list[ApiTokenDetail]:
    tokens = (
        db.query(ApiToken)
        .filter(ApiToken.user_id == current_user.id)
        .order_by(ApiToken.created_at.desc())
        .all()
    )
    return [ApiTokenDetail.model_validate(token) for token in tokens]


def revoke_api_token_internal(
    token_id: str, request: Request, current_user: User, db: Session
) -> None:
    api_token = (
        db.query(ApiToken)
        .filter(ApiToken.id == token_id, ApiToken.user_id == current_user.id)
        .first()
    )
    if api_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="API token not found"
        )
    if api_token.revoked_at is None:
        api_token.revoked_at = datetime.now(timezone.utc)
        db.commit()

        get_audit_logger(db).log_event(
            event_type=SecurityEventType.API_TOKEN_REVOKED,
            request=request,
            user=current_user,
            success=True,
            details={"token_id": api_token.id},
        )


AVATAR_CACHE_CONTROL = "public, max-age=300, must-revalidate"


def _resolve_avatar_target(user_id: str, current_user: User, db: Session) -> User:
    """Return the user whose avatar is being changed; only that user or an admin may."""
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to modify another user's avatar",
        )
    target = current_user if user_id == current_user.id else db.get(User, user_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return target


def _avatar_etag(user: User) -> str:
    digest = hashlib.sha256(
        f"{user.id}:{user.avatar_updated_at.isoformat()}".encode()
    ).hexdigest()
    return f'"{digest[:32]}"'


def set_avatar_internal(
    user_id: str,
    file: UploadFile,
    request: Request,
    current_user: User,
    db: Session,
) -> UserResponseSchema:
    target = _resolve_avatar_target(user_id, current_user, db)

    data = file.file.read(MAX_AVATAR_BYTES + 1)
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Avatar must be at most {MAX_AVATAR_BYTES // (1024 * 1024)} MB",
        )
    if sniff_image_type(data) is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Avatar must be a PNG, JPEG, WebP, or GIF image",
        )
    try:
        data, content_type = normalize_avatar(data)
    except InvalidAvatarError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Avatar could not be processed: {exc}",
        ) from exc

    target.avatar_data = data
    target.avatar_content_type = content_type
    target.avatar_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(target)

    get_audit_logger(db).log_event(
        event_type=SecurityEventType.PROFILE_UPDATED,
        request=request,
        user=current_user,
        success=True,
        details={
            "changes": {"avatar": "updated"},
            "target_user_id": target.id,
            "content_type": content_type,
            "size_bytes": len(data),
        },
    )

    return UserResponseSchema.model_validate(target)


def delete_avatar_internal(
    user_id: str, request: Request, current_user: User, db: Session
) -> None:
    target = _resolve_avatar_target(user_id, current_user, db)
    if target.avatar_updated_at is None:
        return

    target.avatar_data = None
    target.avatar_content_type = None
    target.avatar_updated_at = None
    db.commit()

    get_audit_logger(db).log_event(
        event_type=SecurityEventType.PROFILE_UPDATED,
        request=request,
        user=current_user,
        success=True,
        details={"changes": {"avatar": "removed"}, "target_user_id": target.id},
    )


def get_avatar_internal(user_id: str, request: Request, db: Session) -> Response:
    user = db.get(User, user_id)
    if user is None or user.avatar_updated_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )

    headers = {
        "ETag": _avatar_etag(user),
        "Cache-Control": AVATAR_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
    }
    candidates = {
        tag.strip().removeprefix("W/")
        for tag in request.headers.get("if-none-match", "").split(",")
    }
    if headers["ETag"] in candidates or "*" in candidates:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)

    return Response(
        content=user.avatar_data, media_type=user.avatar_content_type, headers=headers
    )
