from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponseSchema, UserCreateSchema, UserUpdateSchema, UserLogin, TokenResponse, TokenRefreshRequest, TokenRefreshResponse
from app.utils.auth import authenticate_user, create_access_token, create_refresh_token, refresh_access_token
from app.utils.password_security import PasswordSecurity
from app.utils.audit_logger import get_audit_logger
from app.models.security_audit_log import SecurityEventType

def register_user_internal(
    user_data: UserCreateSchema,
    request: Request,
    db: Session
) -> UserResponseSchema:
    
    audit_logger = get_audit_logger(db)
    
    try:
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            # Log failed registration attempt
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.REGISTRATION_FAILED,
                request=request,
                username=user_data.username,
                success=False,
                failure_reason="Username already registered"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            # Log failed registration attempt
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.REGISTRATION_FAILED,
                request=request,
                username=user_data.username,
                success=False,
                failure_reason="Email already registered",
                additional_details={"email": user_data.email}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
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
                additional_details={"validation_error": str(e.detail)}
            )
            raise
        
        # Hash the password
        hashed_password = PasswordSecurity.hash_password(user_data.password)
        
        # Create new user
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password
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
            additional_details={"email": db_user.email}
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
            failure_reason="Username or email already exists (database constraint)"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )

def login_user_internal(login_data: UserLogin, request: Request, db: Session) -> TokenResponse:
    audit_logger = get_audit_logger(db)
    
    # Try to authenticate with username first
    user = authenticate_user(db, login_data.username, login_data.password)
    
    # If username authentication fails, try with email
    if not user:
        user_by_email = db.query(User).filter(User.email == login_data.username).first()
        if user_by_email:
            user = authenticate_user(db, user_by_email.username, login_data.password)
    
    if not user:
        # Log failed login attempt
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.LOGIN_FAILED,
            request=request,
            username=login_data.username,
            success=False,
            failure_reason="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access and refresh tokens
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Log successful login
    audit_logger.log_authentication_event(
        event_type=SecurityEventType.LOGIN_SUCCESS,
        request=request,
        user=user,
        success=True,
        additional_details={
            "login_method": "email" if "@" in login_data.username else "username"
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponseSchema.model_validate(user)
    )

def get_user_profile_internal(current_user: User) -> UserResponseSchema:
    return UserResponseSchema.model_validate(current_user)

def update_user_profile_internal(profile_data: UserUpdateSchema, request: Request, current_user: User, db: Session) -> UserResponseSchema:
    audit_logger = get_audit_logger(db)
    changes = {}
    
    # Check if username is being updated and if it already exists
    if profile_data.username and profile_data.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == profile_data.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        changes["username"] = {"old": current_user.username, "new": profile_data.username}
        current_user.username = profile_data.username
    
    # Check if email is being updated and if it already exists
    if profile_data.email and profile_data.email != current_user.email:
        existing_email = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
        changes["email"] = {"old": current_user.email, "new": profile_data.email}
        current_user.email = profile_data.email
    
    # Update password if provided
    if profile_data.password:
        # Validate password strength
        PasswordSecurity.validate_password_strength_strict(profile_data.password)
        current_user.password_hash = PasswordSecurity.hash_password(profile_data.password)
        changes["password"] = "changed"
        
        # Log password change event
        audit_logger.log_event(
            event_type=SecurityEventType.PASSWORD_CHANGED,
            request=request,
            user=current_user,
            success=True,
            details={"changed_via": "profile_update"}
        )
    
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
                details={"changes": changes}
            )
        
        return UserResponseSchema.model_validate(current_user)
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )


def refresh_token_internal(refresh_data: TokenRefreshRequest, request: Request, db: Session) -> TokenRefreshResponse:
    audit_logger = get_audit_logger(db)
    
    # Try to refresh the token and get user info
    try:
        from jose import jwt, JWTError
        from app.core.config import settings
        
        # Decode the refresh token to get user info for logging
        payload = jwt.decode(refresh_data.refresh_token, settings.secret_key, algorithms=[settings.algorithm])
        username = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "refresh":
            # Log failed refresh attempt
            audit_logger.log_authentication_event(
                event_type=SecurityEventType.TOKEN_REFRESH_FAILED,
                request=request,
                username=username,
                success=False,
                failure_reason="Invalid token type"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user for logging
        user = db.query(User).filter(User.username == username).first()
        
    except JWTError:
        # Log failed refresh attempt with unknown user
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.TOKEN_REFRESH_FAILED,
            request=request,
            success=False,
            failure_reason="Invalid token format"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    new_access_token = refresh_access_token(refresh_data.refresh_token, db)
    
    if not new_access_token:
        # Log failed refresh attempt
        audit_logger.log_authentication_event(
            event_type=SecurityEventType.TOKEN_REFRESH_FAILED,
            request=request,
            user=user,
            success=False,
            failure_reason="Token refresh failed"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful token refresh
    audit_logger.log_authentication_event(
        event_type=SecurityEventType.TOKEN_REFRESH,
        request=request,
        user=user,
        success=True
    )
    
    return TokenRefreshResponse(
        access_token=new_access_token,
        token_type="bearer"
    )