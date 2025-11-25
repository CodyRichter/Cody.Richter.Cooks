"""
Security tests with improved maintainability.
"""
import pytest
import json
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.models.security_audit_log import SecurityAuditLog, SecurityEventType, SecurityRiskLevel
from app.models.user import User
from app.utils.audit_logger import SecurityAuditLogger, get_audit_logger
from app.utils.password_security import PasswordSecurity


@pytest.mark.security
@pytest.mark.unit
class TestPasswordSecurity:
    """Test password security functionality."""
    
    def test_password_hashing_bcrypt_work_factor(self):
        """Test that password hashing uses bcrypt with work factor 12."""
        password = "TestPassword123!"
        hashed = PasswordSecurity.hash_password(password)
        
        # Verify bcrypt format with work factor 12
        assert hashed.startswith('$2b$12$')
        assert hashed != password
        
        # Verify password can be verified
        assert PasswordSecurity.verify_password(password, hashed) is True
        assert PasswordSecurity.verify_password("wrong", hashed) is False
    
    def test_password_salt_uniqueness(self):
        """Test that each password hash uses unique salt."""
        password = "TestPassword123!"
        hashes = [PasswordSecurity.hash_password(password) for _ in range(5)]
        
        # All hashes should be different
        assert len(set(hashes)) == 5
        
        # All should verify the same password
        for hashed in hashes:
            assert PasswordSecurity.verify_password(password, hashed) is True
    
    @pytest.mark.parametrize("invalid_input", [
        ("", "valid_hash"),
        (None, "valid_hash"),
        ("password", ""),
        ("password", None),
        ("password", "invalid_hash")
    ])
    def test_password_verification_edge_cases(self, invalid_input):
        """Test password verification with invalid inputs."""
        password, hashed = invalid_input
        assert PasswordSecurity.verify_password(password, hashed) is False
    
    def test_password_verification_timing_attack_resistance(self):
        """Test password verification timing attack resistance."""
        password = "TestPassword123!"
        hashed = PasswordSecurity.hash_password(password)
        
        # Measure verification times
        times = []
        for _ in range(5):
            start = time.time()
            PasswordSecurity.verify_password(password, hashed)
            times.append(time.time() - start)
        
        wrong_times = []
        for _ in range(5):
            start = time.time()
            PasswordSecurity.verify_password("WrongPassword123!", hashed)
            wrong_times.append(time.time() - start)
        
        # Times should be similar (bcrypt provides constant-time comparison)
        avg_correct = sum(times) / len(times)
        avg_wrong = sum(wrong_times) / len(wrong_times)
        assert abs(avg_correct - avg_wrong) < 0.1  # 100ms tolerance


@pytest.mark.security
@pytest.mark.unit
class TestPasswordStrengthValidation:
    """Test password strength validation."""
    
    @pytest.mark.parametrize("password,should_be_valid", [
        ("StrongPassword123!", True),
        ("VeryStrongPassword123!@#", True),
        ("weak", False),
        ("NoDigitsHere!", False),
        ("nouppercasehere123!", False),
        ("NOLOWERCASEHERE123!", False),
        ("NoSpecialChars123", False),
        ("Short1!", False),  # Too short
    ])
    def test_password_strength_validation(self, password: str, should_be_valid: bool):
        """Test password strength validation with various passwords."""
        result = PasswordSecurity.validate_password_constraints(password)
        
        assert result.is_valid == should_be_valid
        
        if should_be_valid:
            assert len(result.errors) == 0
        else:
            assert len(result.errors) > 0


@pytest.mark.security
@pytest.mark.integration
class TestSecurityAuditLogging:
    """Test security audit logging functionality."""
    
    def test_audit_log_creation(self, db_session: Session, test_user: User):
        """Test creating security audit log entries."""
        audit_log = SecurityAuditLog(
            user_id=test_user.id,
            ip_address="192.168.1.100",
            user_agent="Test Browser",
            event_type=SecurityEventType.LOGIN_SUCCESS.value,
            risk_level=SecurityRiskLevel.LOW.value,
            details='{"test": "data"}',
            endpoint="POST /api/v1/users/login",
            success="true"
        )
        db_session.add(audit_log)
        db_session.commit()
        db_session.refresh(audit_log)
        
        assert audit_log.id is not None
        assert audit_log.user_id == test_user.id
        assert audit_log.event_type == SecurityEventType.LOGIN_SUCCESS.value
        assert audit_log.risk_level == SecurityRiskLevel.LOW.value
        assert audit_log.timestamp is not None
    
    def test_audit_log_without_user(self, db_session: Session):
        """Test audit log for anonymous events."""
        audit_log = SecurityAuditLog(
            ip_address="10.0.0.1",
            user_agent="Suspicious Bot",
            event_type=SecurityEventType.RATE_LIMIT_EXCEEDED.value,
            risk_level=SecurityRiskLevel.HIGH.value,
            success="false"
        )
        db_session.add(audit_log)
        db_session.commit()
        db_session.refresh(audit_log)
        
        assert audit_log.user_id is None
        assert audit_log.event_type == SecurityEventType.RATE_LIMIT_EXCEEDED.value
        assert audit_log.risk_level == SecurityRiskLevel.HIGH.value
    
    @pytest.mark.parametrize("event_type,expected_risk", [
        (SecurityEventType.LOGIN_SUCCESS, SecurityRiskLevel.LOW),
        (SecurityEventType.LOGIN_FAILED, SecurityRiskLevel.MEDIUM),
        (SecurityEventType.ACCOUNT_LOCKED, SecurityRiskLevel.HIGH),
        (SecurityEventType.SUSPICIOUS_ACTIVITY, SecurityRiskLevel.CRITICAL),
    ])
    def test_risk_level_determination(self, event_type: SecurityEventType, expected_risk: SecurityRiskLevel):
        """Test automatic risk level determination for events."""
        risk_level = SecurityAuditLog.get_risk_level_for_event(event_type)
        assert risk_level == expected_risk


@pytest.mark.security
@pytest.mark.integration
class TestSecurityAuditLogger:
    """Test SecurityAuditLogger service."""
    
    def test_audit_logger_creation(self, db_session: Session):
        """Test creating audit logger instances."""
        logger = SecurityAuditLogger(db_session)
        assert logger.db == db_session
        
        factory_logger = get_audit_logger(db_session)
        assert isinstance(factory_logger, SecurityAuditLogger)
    
    def test_log_basic_event(self, db_session: Session, test_user: User):
        """Test logging basic security events."""
        logger = SecurityAuditLogger(db_session)
        
        audit_log = logger.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            user=test_user,
            ip_address="192.168.1.100",
            user_agent="Test Browser",
            endpoint="POST /api/v1/users/login",
            details={"test": "data"}
        )
        
        assert audit_log.user_id == test_user.id
        assert audit_log.ip_address == "192.168.1.100"
        assert audit_log.event_type == SecurityEventType.LOGIN_SUCCESS.value
        assert json.loads(audit_log.details) == {"test": "data"}
    
    def test_log_event_with_request(self, db_session: Session, test_user: User, mock_request):
        """Test logging events with FastAPI request objects."""
        logger = SecurityAuditLogger(db_session)
        
        # Configure mock request
        mock_request.headers = {
            "user-agent": "Test Browser",
            "x-forwarded-for": "192.168.1.100"
        }
        mock_request.method = "POST"
        mock_request.url.path = "/api/v1/users/login"
        
        audit_log = logger.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            request=mock_request,
            user=test_user
        )
        
        assert audit_log.ip_address == "192.168.1.100"
        assert audit_log.user_agent == "Test Browser"
        assert audit_log.endpoint == "POST /api/v1/users/login"
    
    @pytest.mark.parametrize("header_scenario", [
        ({"x-forwarded-for": "192.168.1.100, 10.0.0.1"}, "192.168.1.100"),
        ({"x-real-ip": "203.0.113.1"}, "203.0.113.1"),
        ({}, "192.168.1.100"),  # Falls back to client.host
    ])
    def test_ip_address_extraction(self, db_session: Session, header_scenario):
        """Test IP address extraction from various headers."""
        headers, expected_ip = header_scenario
        logger = SecurityAuditLogger(db_session)
        
        mock_request = Mock()
        mock_request.headers = headers
        mock_request.method = "GET"
        mock_request.url.path = "/test"
        mock_request.client.host = "192.168.1.100"
        
        audit_log = logger.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            request=mock_request
        )
        
        assert audit_log.ip_address == expected_ip
    
    def test_authentication_event_logging(self, db_session: Session, test_user: User, mock_request):
        """Test authentication-specific event logging."""
        logger = SecurityAuditLogger(db_session)
        
        # Test successful authentication
        success_log = logger.log_authentication_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            request=mock_request,
            user=test_user,
            success=True
        )
        
        assert success_log.success == "true"
        details = json.loads(success_log.details)
        assert details["user_id"] == test_user.id
        assert details["username"] == test_user.username
        
        # Test failed authentication
        failure_log = logger.log_authentication_event(
            event_type=SecurityEventType.LOGIN_FAILED,
            request=mock_request,
            username="nonexistent",
            success=False,
            failure_reason="Invalid credentials"
        )
        
        assert failure_log.success == "false"
        assert failure_log.user_id is None
        details = json.loads(failure_log.details)
        assert details["username"] == "nonexistent"
        assert details["failure_reason"] == "Invalid credentials"
    
    def test_rate_limit_event_logging(self, db_session: Session, mock_request):
        """Test rate limit event logging."""
        logger = SecurityAuditLogger(db_session)
        
        audit_log = logger.log_rate_limit_event(
            request=mock_request,
            limit_type="ip",
            limit_value=5,
            current_count=6
        )
        
        assert audit_log.event_type == SecurityEventType.RATE_LIMIT_EXCEEDED.value
        assert audit_log.risk_level == SecurityRiskLevel.HIGH.value
        
        details = json.loads(audit_log.details)
        assert details["limit_type"] == "ip"
        assert details["limit_value"] == 5
        assert details["current_count"] == 6
        assert details["exceeded_by"] == 1
    
    def test_suspicious_activity_logging(self, db_session: Session, mock_request):
        """Test suspicious activity logging."""
        logger = SecurityAuditLogger(db_session)
        
        audit_log = logger.log_suspicious_activity(
            request=mock_request,
            activity_type="brute_force",
            description="Multiple failed login attempts",
            additional_details={"attempts": 10}
        )
        
        assert audit_log.event_type == SecurityEventType.SUSPICIOUS_ACTIVITY.value
        assert audit_log.risk_level == SecurityRiskLevel.CRITICAL.value
        
        details = json.loads(audit_log.details)
        assert details["activity_type"] == "brute_force"
        assert details["description"] == "Multiple failed login attempts"
        assert details["attempts"] == 10
    
    def test_user_security_events_retrieval(self, db_session: Session, test_user: User):
        """Test retrieving security events for users."""
        logger = SecurityAuditLogger(db_session)
        
        # Create multiple events
        logger.log_event(SecurityEventType.LOGIN_SUCCESS, user=test_user, ip_address="192.168.1.100")
        logger.log_event(SecurityEventType.LOGIN_FAILED, user=test_user, ip_address="192.168.1.100")
        logger.log_event(SecurityEventType.PASSWORD_CHANGED, user=test_user, ip_address="192.168.1.100")
        
        # Get all events
        all_events = logger.get_user_security_events(test_user.id)
        assert len(all_events) == 3
        
        # Filter by event type
        login_events = logger.get_user_security_events(
            test_user.id,
            event_types=[SecurityEventType.LOGIN_SUCCESS, SecurityEventType.LOGIN_FAILED]
        )
        assert len(login_events) == 2
        
        # Filter by risk level
        medium_risk_events = logger.get_user_security_events(
            test_user.id,
            risk_levels=[SecurityRiskLevel.MEDIUM]
        )
        assert len(medium_risk_events) == 2  # LOGIN_FAILED and PASSWORD_CHANGED
        
        # Test limit
        limited_events = logger.get_user_security_events(test_user.id, limit=2)
        assert len(limited_events) == 2
    
    def test_high_risk_events_retrieval(self, db_session: Session, test_user: User, mock_request):
        """Test retrieving high-risk security events."""
        logger = SecurityAuditLogger(db_session)
        
        # Create events with different risk levels
        logger.log_event(SecurityEventType.LOGIN_SUCCESS, user=test_user, ip_address="192.168.1.100")  # LOW
        logger.log_event(SecurityEventType.LOGIN_FAILED, user=test_user, ip_address="192.168.1.100")   # MEDIUM
        logger.log_event(SecurityEventType.ACCOUNT_LOCKED, user=test_user, ip_address="192.168.1.100") # HIGH
        logger.log_suspicious_activity(
            request=mock_request,
            activity_type="test",
            description="Test suspicious activity"
        )  # CRITICAL
        
        high_risk_events = logger.get_high_risk_events(hours=24)
        assert len(high_risk_events) == 2  # HIGH and CRITICAL only
        
        risk_levels = [event.risk_level for event in high_risk_events]
        assert SecurityRiskLevel.HIGH.value in risk_levels
        assert SecurityRiskLevel.CRITICAL.value in risk_levels
    
    def test_failed_login_analysis(self, db_session: Session, mock_request):
        """Test failed login attempt analysis."""
        logger = SecurityAuditLogger(db_session)
        
        # Create multiple failed login attempts
        for i in range(3):
            logger.log_authentication_event(
                event_type=SecurityEventType.LOGIN_FAILED,
                request=mock_request,
                username="testuser",
                success=False,
                failure_reason="Invalid credentials"
            )
        
        # Analyze failed attempts
        analysis = logger.analyze_failed_login_attempts(hours=1)
        
        assert analysis["total_failed_attempts"] == 3
        assert analysis["unique_ips"] >= 1
        assert analysis["unique_usernames"] >= 1
        assert len(analysis["top_ips"]) >= 1
        assert len(analysis["top_usernames"]) >= 1
    
    def test_details_serialization_error_handling(self, db_session: Session):
        """Test handling of details serialization errors."""
        logger = SecurityAuditLogger(db_session)
        
        # Create unserializable object
        class UnserializableObject:
            def __str__(self):
                raise Exception("Cannot serialize")
        
        details = {"unserializable": UnserializableObject()}
        
        audit_log = logger.log_event(
            event_type=SecurityEventType.LOGIN_SUCCESS,
            ip_address="192.168.1.100",
            details=details
        )
        
        # Should handle error gracefully
        assert audit_log.details is not None
        parsed_details = json.loads(audit_log.details)
        assert "error" in parsed_details
        assert parsed_details["error"] == "Failed to serialize details"
    
    @patch('app.utils.audit_logger.logger')
    def test_application_logging_integration(self, mock_logger, db_session: Session, mock_request):
        """Test integration with application logging."""
        logger = SecurityAuditLogger(db_session)
        
        # Test different risk levels trigger appropriate log levels
        logger.log_suspicious_activity(
            request=mock_request,
            activity_type="test",
            description="Critical event"
        )
        mock_logger.critical.assert_called()
        
        logger.log_event(SecurityEventType.ACCOUNT_LOCKED, ip_address="192.168.1.100")
        mock_logger.error.assert_called()
        
        logger.log_event(SecurityEventType.LOGIN_FAILED, ip_address="192.168.1.100")
        mock_logger.warning.assert_called()
        
        logger.log_event(SecurityEventType.LOGIN_SUCCESS, ip_address="192.168.1.100")
        mock_logger.info.assert_called()