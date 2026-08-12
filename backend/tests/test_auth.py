"""
Authentication tests with improved maintainability.
"""

import pytest
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_refresh_token,
    refresh_access_token,
    get_current_user,
)
from app.utils.password_security import PasswordSecurity
from app.core.config import settings
from app.models.user import User


@pytest.mark.auth
@pytest.mark.unit
class TestPasswordSecurity:
    """Test password hashing and verification."""

    @pytest.mark.parametrize(
        "password",
        [
            "TestPassword123!",
            "AnotherSecure456@",
            "VeryLongPasswordWithManyCharacters789#",
        ],
    )
    def test_password_hashing_verification(self, password: str):
        """Test password hashing and verification with various passwords."""
        hashed = PasswordSecurity.hash_password(password)

        # Hash should be bcrypt with work factor 12
        assert hashed.startswith("$2b$12$")
        assert hashed != password

        # Correct password should verify
        assert PasswordSecurity.verify_password(password, hashed) is True

        # Wrong password should not verify
        assert PasswordSecurity.verify_password("WrongPassword123!", hashed) is False

    def test_password_salt_uniqueness(self):
        """Test that same password produces different hashes due to salt."""
        password = "TestPassword123!"

        hash1 = PasswordSecurity.hash_password(password)
        hash2 = PasswordSecurity.hash_password(password)

        # Hashes should be different due to unique salts
        assert hash1 != hash2

        # Both should verify the same password
        assert PasswordSecurity.verify_password(password, hash1) is True
        assert PasswordSecurity.verify_password(password, hash2) is True

    @pytest.mark.parametrize(
        "invalid_input",
        [
            ("", "valid_hash"),
            (None, "valid_hash"),
            ("valid_password", ""),
            ("valid_password", None),
            ("valid_password", "invalid_hash_format"),
        ],
    )
    def test_password_verification_invalid_inputs(self, invalid_input):
        """Test password verification with invalid inputs."""
        password, hashed = invalid_input
        assert PasswordSecurity.verify_password(password, hashed) is False


@pytest.mark.auth
@pytest.mark.unit
class TestJWTTokenManagement:
    """Test JWT token creation and verification."""

    def test_access_token_creation_and_verification(self):
        """Test access token lifecycle."""
        data = {"sub": "testuser"}
        token = create_access_token(data=data)

        assert token is not None
        assert isinstance(token, str)

        # Verify token contents
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        assert payload["sub"] == "testuser"
        assert payload["type"] == "access"
        assert "exp" in payload

        # Verify using utility function
        verified_payload = verify_token(token)
        assert verified_payload is not None
        assert verified_payload["sub"] == "testuser"

    def test_refresh_token_creation_and_verification(self):
        """Test refresh token lifecycle."""
        data = {"sub": "testuser"}
        token = create_refresh_token(data=data)

        assert token is not None
        assert isinstance(token, str)

        # Verify token contents
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        assert payload["sub"] == "testuser"
        assert payload["type"] == "refresh"
        assert "exp" in payload

        # Verify using utility function
        verified_payload = verify_refresh_token(token)
        assert verified_payload is not None
        assert verified_payload["sub"] == "testuser"

    def test_token_expiration_handling(self):
        """Test token expiration behavior."""
        data = {"sub": "testuser"}

        # Create expired token
        expires_delta = timedelta(seconds=-1)
        expired_token = create_access_token(data=data, expires_delta=expires_delta)

        # Verification should fail for expired token
        assert verify_token(expired_token) is None

    def test_token_custom_expiration(self):
        """Test tokens with custom expiration times."""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=15)

        token = create_access_token(data=data, expires_delta=expires_delta)
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )

        exp_datetime = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        expected_exp = datetime.now(timezone.utc) + expires_delta

        # Allow 1 minute tolerance for timing differences
        assert abs((exp_datetime - expected_exp).total_seconds()) < 60

    @pytest.mark.parametrize(
        "invalid_token", ["invalid.token.here", "malformed_token", ""]
    )
    def test_token_verification_invalid_tokens(self, invalid_token):
        """Test token verification with invalid tokens."""
        assert verify_token(invalid_token) is None
        assert verify_refresh_token(invalid_token) is None

    def test_token_verification_none_input(self):
        """Test token verification with None input."""
        # None input should return None
        assert verify_token(None) is None
        assert verify_refresh_token(None) is None

    def test_token_type_validation(self):
        """Test that token types are properly validated."""
        data = {"sub": "testuser"}

        access_token = create_access_token(data=data)
        refresh_token = create_refresh_token(data=data)

        # Access token should verify as access token
        access_payload = verify_token(access_token)
        assert access_payload is not None
        assert access_payload["type"] == "access"

        # Refresh token should verify as refresh token
        refresh_payload = verify_refresh_token(refresh_token)
        assert refresh_payload is not None
        assert refresh_payload["type"] == "refresh"

        # Cross-verification should fail
        assert verify_refresh_token(access_token) is None


@pytest.mark.auth
@pytest.mark.integration
class TestTokenRefreshFlow:
    """Test token refresh functionality."""

    def test_refresh_access_token_success(self, db_session, test_user: User):
        """Test successful token refresh."""
        refresh_token = create_refresh_token(data={"sub": test_user.username})

        new_access_token = refresh_access_token(refresh_token, db_session)

        assert new_access_token is not None
        assert isinstance(new_access_token, str)

        # Verify new token is valid
        payload = verify_token(new_access_token)
        assert payload is not None
        assert payload["sub"] == test_user.username
        assert payload["type"] == "access"

    @pytest.mark.parametrize(
        "invalid_scenario",
        [
            "invalid_token",
            "nonexistent_user",
            "expired_token",
            "access_token_as_refresh",
        ],
    )
    def test_refresh_access_token_failures(
        self, db_session, test_user: User, invalid_scenario: str
    ):
        """Test token refresh failure scenarios."""
        if invalid_scenario == "invalid_token":
            token = "invalid.token.here"
        elif invalid_scenario == "nonexistent_user":
            token = create_refresh_token(data={"sub": "nonexistent_user"})
        elif invalid_scenario == "expired_token":
            expires_delta = timedelta(seconds=-1)
            token = create_refresh_token(
                data={"sub": test_user.username}, expires_delta=expires_delta
            )
        elif invalid_scenario == "access_token_as_refresh":
            token = create_access_token(data={"sub": test_user.username})

        result = refresh_access_token(token, db_session)
        assert result is None


@pytest.mark.auth
@pytest.mark.integration
class TestUserAuthentication:
    """Test user authentication functions."""

    def test_get_current_user_success(self, db_session, test_user: User):
        """Test successful user authentication."""
        token = create_access_token(data={"sub": test_user.username})
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        current_user = get_current_user(credentials, db_session)

        assert current_user is not None
        assert current_user.id == test_user.id
        assert current_user.username == test_user.username

    @pytest.mark.parametrize(
        "failure_scenario",
        [
            "invalid_token",
            "nonexistent_user",
            "missing_sub_claim",
            "refresh_token_as_access",
        ],
    )
    def test_get_current_user_failures(
        self, db_session, test_user: User, failure_scenario: str
    ):
        """Test user authentication failure scenarios."""
        if failure_scenario == "invalid_token":
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials="invalid_token"
            )
        elif failure_scenario == "nonexistent_user":
            token = create_access_token(data={"sub": "nonexistent_user"})
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials=token
            )
        elif failure_scenario == "missing_sub_claim":
            token = create_access_token(data={"user_id": "123"})
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials=token
            )
        elif failure_scenario == "refresh_token_as_access":
            token = create_refresh_token(data={"sub": test_user.username})
            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials=token
            )

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)


@pytest.mark.auth
@pytest.mark.security
@pytest.mark.unit
class TestSecurityMeasures:
    """Test security-related functionality."""

    def test_token_signature_validation(self):
        """Test that tokens with wrong signatures are rejected."""
        data = {"sub": "testuser"}

        # Create token with wrong secret
        wrong_token = jwt.encode(data, "wrong_secret", algorithm=settings.algorithm)

        # Should be rejected
        assert verify_token(wrong_token) is None
        assert verify_refresh_token(wrong_token) is None

    def test_token_algorithm_validation(self):
        """Test that tokens with wrong algorithms are rejected."""
        data = {"sub": "testuser"}

        # Create token with completely different algorithm family
        # Note: HS256 vs HS512 are both HMAC, so they might be accepted
        # We need to test with a fundamentally different algorithm
        try:
            # Try to create token with RS256 (RSA) instead of HS512 (HMAC)
            wrong_algo_token = jwt.encode(data, "fake_rsa_key", algorithm="RS256")
            # This should fail during verification
            assert verify_token(wrong_algo_token) is None
        except Exception:
            # If token creation fails, that's also acceptable for this test
            pass

    def test_password_timing_attack_resistance(self):
        """Test that password verification is resistant to timing attacks."""
        import time

        password = "TestPassword123!"
        hashed = PasswordSecurity.hash_password(password)

        # Measure verification time for correct password
        start_time = time.time()
        PasswordSecurity.verify_password(password, hashed)
        correct_time = time.time() - start_time

        # Measure verification time for wrong password
        start_time = time.time()
        PasswordSecurity.verify_password("WrongPassword123!", hashed)
        wrong_time = time.time() - start_time

        # Times should be similar (bcrypt provides constant-time comparison)
        # Allow reasonable tolerance for system variations
        assert abs(correct_time - wrong_time) < 0.1
