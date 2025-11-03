import re
from typing import Dict
from pydantic import BaseModel
import bcrypt
from fastapi import HTTPException, status

from app.core.config import settings


class PasswordConstraintValidationResult(BaseModel):
    is_valid: bool
    errors: list[str]

class PasswordSecurity:
    """Enhanced password security with bcrypt work factor 12 and comprehensive validation."""
    
    # Special characters allowed in passwords
    SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """
        Hash a password using bcrypt with work factor 12.
        
        Args:
            password: Plain text password to hash
            
        Returns:
            Bcrypt hashed password string
            
        Raises:
            ValueError: If password is empty or None
        """
        if not password:
            raise ValueError("Password cannot be empty")

        salt = bcrypt.gensalt(rounds=settings.bcrypt_rounds)
        password_bytes = password.encode('utf-8')
        hashed = bcrypt.hashpw(password_bytes, salt)
        
        return hashed.decode('utf-8')
    
    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash using constant-time comparison.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Bcrypt hashed password to verify against
            
        Returns:
            True if password matches, False otherwise
        """
        if not plain_password or not hashed_password:
            return False
        
        try:
            password_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            
            # bcrypt.checkpw uses constant-time comparison internally
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except (ValueError, TypeError):
            return False
    
    @classmethod
    def validate_password_constraints(cls, password: str) -> PasswordConstraintValidationResult:
        """
        Validate a candidate password against constraints.
        
        Args:
            password: Password to validate
            
        Returns:
            Dictionary with validation results:
            - is_valid: bool - Overall validation result
            - errors: List[str] - List of validation errors
        """
        errors = []

        if not password:
            return PasswordConstraintValidationResult(
                is_valid=False,
                errors=["Password is required"]
            )
        
        # Length validation
        if len(password) < settings.password_min_length:
            errors.append(f"Password must be at least {settings.password_min_length} characters long")
            
        if len(password) > settings.password_max_length:
            errors.append(f"Password must not exceed {settings.password_max_length} characters")
        
        # Character type requirements
        has_uppercase = bool(re.search(r'[A-Z]', password))
        has_lowercase = bool(re.search(r'[a-z]', password))
        has_digits = bool(re.search(r'\d', password))
        has_special = bool(re.search(f'[{re.escape(cls.SPECIAL_CHARS)}]', password))
        
        if settings.password_require_uppercase and not has_uppercase:
            errors.append("Password must contain at least one uppercase letter")
            
        if settings.password_require_lowercase and not has_lowercase:
            errors.append("Password must contain at least one lowercase letter")
            
        if settings.password_require_digits and not has_digits:
            errors.append("Password must contain at least one digit")
            
        if settings.password_require_special and not has_special:
            errors.append(f"Password must contain at least one special character ({cls.SPECIAL_CHARS})")

        return PasswordConstraintValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )
    
    @classmethod
    def validate_password_strength_strict(cls, password: str) -> None:
        """
        Validate password strength and raise HTTPException if invalid.
        Pass silently if all constraints are satisfied
        
        Args:
            password: Password to validate
            
        Raises:
            HTTPException: If password doesn't meet strength requirements
        """
        validation_result = cls.validate_password_constraints(password)
        
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": validation_result.errors,
                }
            )
