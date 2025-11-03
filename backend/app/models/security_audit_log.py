"""
Security audit log model for tracking authentication and security events.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING
from enum import Enum

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator

if TYPE_CHECKING:
    from app.models.user import User


class SecurityEventType(str, Enum):
    """Security event types for audit logging."""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGED = "password_changed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    TOKEN_REFRESH = "token_refresh"
    TOKEN_REFRESH_FAILED = "token_refresh_failed"
    REGISTRATION_SUCCESS = "registration_success"
    REGISTRATION_FAILED = "registration_failed"
    PROFILE_UPDATED = "profile_updated"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class SecurityRiskLevel(str, Enum):
    """Security risk levels for event classification."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityAuditLog(Base):
    """
    Security audit log model for comprehensive event tracking.
    
    Attributes:
        id: Primary key (secure string format)
        user_id: Foreign key to user (optional for anonymous events)
        ip_address: IP address of the request
        user_agent: User agent string from request headers
        event_type: Type of security event
        risk_level: Risk level classification
        details: Additional event details in JSON format
        timestamp: When the event occurred
        session_id: Session identifier (optional)
        endpoint: API endpoint that triggered the event
        success: Whether the action was successful
    """
    __tablename__ = "security_audit_logs"
    
    id = Column(String(17), primary_key=True, index=True)  # SA- prefix makes it longer
    user_id = Column(String(15), ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=False, index=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    details = Column(Text, nullable=True)  # JSON string for additional details
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    endpoint = Column(String(255), nullable=True)
    success = Column(String(10), nullable=False, default="true")  # "true", "false", "partial"
    
    # Relationships
    user = relationship("User", backref="security_audit_logs")
    
    # Database indices for optimized queries
    __table_args__ = (
        Index('idx_security_audit_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_security_audit_ip_timestamp', 'ip_address', 'timestamp'),
        Index('idx_security_audit_event_risk', 'event_type', 'risk_level'),
        Index('idx_security_audit_timestamp_risk', 'timestamp', 'risk_level'),
    )
    
    def __init__(self, **kwargs):
        """Initialize SecurityAuditLog with auto-generated secure ID if not provided."""
        if 'id' not in kwargs:
            kwargs['id'] = SecureIDGenerator.generate_id('SAL')
        super().__init__(**kwargs)
    
    def __repr__(self) -> str:
        return f"<SecurityAuditLog(id={self.id}, event_type='{self.event_type}', risk_level='{self.risk_level}', timestamp='{self.timestamp}')>"
    
    @classmethod
    def get_risk_level_for_event(cls, event_type: SecurityEventType) -> SecurityRiskLevel:
        """
        Get the appropriate risk level for a given event type.
        
        Args:
            event_type: The security event type
            
        Returns:
            The corresponding risk level
        """
        risk_mapping = {
            SecurityEventType.LOGIN_SUCCESS: SecurityRiskLevel.LOW,
            SecurityEventType.LOGIN_FAILED: SecurityRiskLevel.MEDIUM,
            SecurityEventType.LOGOUT: SecurityRiskLevel.LOW,
            SecurityEventType.PASSWORD_CHANGED: SecurityRiskLevel.MEDIUM,
            SecurityEventType.ACCOUNT_LOCKED: SecurityRiskLevel.HIGH,
            SecurityEventType.ACCOUNT_UNLOCKED: SecurityRiskLevel.MEDIUM,
            SecurityEventType.TOKEN_REFRESH: SecurityRiskLevel.LOW,
            SecurityEventType.TOKEN_REFRESH_FAILED: SecurityRiskLevel.MEDIUM,
            SecurityEventType.REGISTRATION_SUCCESS: SecurityRiskLevel.LOW,
            SecurityEventType.REGISTRATION_FAILED: SecurityRiskLevel.MEDIUM,
            SecurityEventType.PROFILE_UPDATED: SecurityRiskLevel.LOW,
            SecurityEventType.RATE_LIMIT_EXCEEDED: SecurityRiskLevel.HIGH,
            SecurityEventType.SUSPICIOUS_ACTIVITY: SecurityRiskLevel.CRITICAL,
        }
        return risk_mapping.get(event_type, SecurityRiskLevel.MEDIUM)