"""
Security audit logging service for tracking authentication and security events.
"""
import json
import logging
from typing import Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi import Request

from app.models.security_audit_log import SecurityAuditLog, SecurityEventType, SecurityRiskLevel
from app.models.user import User

logger = logging.getLogger(__name__)


class SecurityAuditLogger:
    """
    Service for logging security events with comprehensive tracking.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the audit logger with database session.
        
        Args:
            db: Database session for logging events
        """
        self.db = db
    
    def log_event(
        self,
        event_type: SecurityEventType,
        request: Optional[Request] = None,
        user: Optional[User] = None,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        risk_level: Optional[SecurityRiskLevel] = None,
        endpoint: Optional[str] = None,
        success: bool = True,
        session_id: Optional[str] = None
    ) -> SecurityAuditLog:
        """
        Log a security event with comprehensive details.
        
        Args:
            event_type: Type of security event
            request: FastAPI request object (optional)
            user: User object (optional)
            user_id: User ID (optional, used if user object not provided)
            ip_address: IP address (optional, extracted from request if not provided)
            user_agent: User agent string (optional, extracted from request if not provided)
            details: Additional event details
            risk_level: Risk level (optional, auto-determined if not provided)
            endpoint: API endpoint (optional, extracted from request if not provided)
            success: Whether the action was successful
            session_id: Session identifier (optional)
            
        Returns:
            The created SecurityAuditLog entry
        """
        try:
            # Extract information from request if provided
            if request:
                if not ip_address:
                    ip_address = self._get_client_ip(request)
                if not user_agent:
                    user_agent = request.headers.get("user-agent", "Unknown")
                if not endpoint:
                    endpoint = f"{request.method} {request.url.path}"
            
            # Use default values if still not provided
            ip_address = ip_address or "Unknown"
            user_agent = user_agent or "Unknown"
            
            # Determine user_id
            if user and not user_id:
                user_id = user.id
            
            # Determine risk level if not provided
            if not risk_level:
                risk_level = SecurityAuditLog.get_risk_level_for_event(event_type)
            
            # Serialize details to JSON
            details_json = None
            if details:
                try:
                    details_json = json.dumps(details, default=str)
                except (TypeError, ValueError, Exception) as e:
                    logger.warning(f"Failed to serialize audit log details: {e}")
                    details_json = json.dumps({"error": "Failed to serialize details", "original_error": str(e)})
            
            # Create audit log entry
            audit_log = SecurityAuditLog(
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                event_type=event_type.value,
                risk_level=risk_level.value,
                details=details_json,
                endpoint=endpoint,
                success="true" if success else "false",
                session_id=session_id
            )
            
            # Save to database
            self.db.add(audit_log)
            self.db.commit()
            self.db.refresh(audit_log)
            
            # Log to application logger based on risk level
            self._log_to_application_logger(audit_log)
            
            return audit_log
            
        except Exception as e:
            logger.error(f"Failed to create security audit log: {e}")
            self.db.rollback()
            raise
    
    def log_authentication_event(
        self,
        event_type: SecurityEventType,
        request: Request,
        username: Optional[str] = None,
        user: Optional[User] = None,
        success: bool = True,
        failure_reason: Optional[str] = None,
        additional_details: Optional[Dict[str, Any]] = None
    ) -> SecurityAuditLog:
        """
        Log authentication-specific events with relevant details.
        
        Args:
            event_type: Type of authentication event
            request: FastAPI request object
            username: Username attempted (for failed logins)
            user: User object (for successful operations)
            success: Whether the authentication was successful
            failure_reason: Reason for authentication failure
            additional_details: Additional event details
            
        Returns:
            The created SecurityAuditLog entry
        """
        details = additional_details or {}
        
        if username:
            details["username"] = username
        if failure_reason:
            details["failure_reason"] = failure_reason
        if user:
            details["user_id"] = user.id
            details["username"] = user.username
        
        return self.log_event(
            event_type=event_type,
            request=request,
            user=user,
            details=details,
            success=success
        )
    
    def log_rate_limit_event(
        self,
        request: Request,
        limit_type: str,
        limit_value: int,
        current_count: int,
        user: Optional[User] = None,
        additional_details: Optional[Dict[str, Any]] = None
    ) -> SecurityAuditLog:
        """
        Log rate limiting events.
        
        Args:
            request: FastAPI request object
            limit_type: Type of rate limit (e.g., "ip", "user", "endpoint")
            limit_value: The rate limit threshold
            current_count: Current request count
            user: User object if applicable
            additional_details: Additional event details
            
        Returns:
            The created SecurityAuditLog entry
        """
        details = additional_details or {}
        details.update({
            "limit_type": limit_type,
            "limit_value": limit_value,
            "current_count": current_count,
            "exceeded_by": current_count - limit_value
        })
        
        return self.log_event(
            event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
            request=request,
            user=user,
            details=details,
            success=False
        )
    
    def log_suspicious_activity(
        self,
        request: Request,
        activity_type: str,
        description: str,
        user: Optional[User] = None,
        additional_details: Optional[Dict[str, Any]] = None
    ) -> SecurityAuditLog:
        """
        Log suspicious activity events.
        
        Args:
            request: FastAPI request object
            activity_type: Type of suspicious activity
            description: Description of the suspicious activity
            user: User object if applicable
            additional_details: Additional event details
            
        Returns:
            The created SecurityAuditLog entry
        """
        details = additional_details or {}
        details.update({
            "activity_type": activity_type,
            "description": description
        })
        
        return self.log_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            request=request,
            user=user,
            details=details,
            risk_level=SecurityRiskLevel.CRITICAL,
            success=False
        )
    
    def get_user_security_events(
        self,
        user_id: int,
        limit: int = 100,
        event_types: Optional[list[SecurityEventType]] = None,
        risk_levels: Optional[list[SecurityRiskLevel]] = None
    ) -> list[SecurityAuditLog]:
        """
        Get security events for a specific user.
        
        Args:
            user_id: User ID to query events for
            limit: Maximum number of events to return
            event_types: Filter by specific event types
            risk_levels: Filter by specific risk levels
            
        Returns:
            List of security audit log entries
        """
        query = self.db.query(SecurityAuditLog).filter(SecurityAuditLog.user_id == user_id)
        
        if event_types:
            query = query.filter(SecurityAuditLog.event_type.in_([et.value for et in event_types]))
        
        if risk_levels:
            query = query.filter(SecurityAuditLog.risk_level.in_([rl.value for rl in risk_levels]))
        
        return query.order_by(SecurityAuditLog.timestamp.desc()).limit(limit).all()
    
    def get_high_risk_events(
        self,
        hours: int = 24,
        limit: int = 100
    ) -> list[SecurityAuditLog]:
        """
        Get high-risk security events from the last N hours.
        
        Args:
            hours: Number of hours to look back
            limit: Maximum number of events to return
            
        Returns:
            List of high-risk security audit log entries
        """
        from datetime import datetime, timedelta, timezone
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        return (
            self.db.query(SecurityAuditLog)
            .filter(
                SecurityAuditLog.timestamp >= cutoff_time,
                SecurityAuditLog.risk_level.in_([SecurityRiskLevel.HIGH.value, SecurityRiskLevel.CRITICAL.value])
            )
            .order_by(SecurityAuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )
    
    def analyze_failed_login_attempts(
        self,
        ip_address: Optional[str] = None,
        username: Optional[str] = None,
        hours: int = 1
    ) -> Dict[str, Any]:
        """
        Analyze failed login attempts for potential brute force attacks.
        
        Args:
            ip_address: IP address to analyze (optional)
            username: Username to analyze (optional)
            hours: Number of hours to analyze
            
        Returns:
            Analysis results with counts and patterns
        """
        from datetime import datetime, timedelta, timezone
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        query = (
            self.db.query(SecurityAuditLog)
            .filter(
                SecurityAuditLog.event_type == SecurityEventType.LOGIN_FAILED.value,
                SecurityAuditLog.timestamp >= cutoff_time
            )
        )
        
        if ip_address:
            query = query.filter(SecurityAuditLog.ip_address == ip_address)
        
        if username:
            # Parse username from details JSON
            query = query.filter(SecurityAuditLog.details.contains(f'"username": "{username}"'))
        
        failed_attempts = query.all()
        
        # Analyze patterns
        ip_counts = {}
        username_counts = {}
        
        for attempt in failed_attempts:
            # Count by IP
            ip_counts[attempt.ip_address] = ip_counts.get(attempt.ip_address, 0) + 1
            
            # Count by username (extract from details)
            if attempt.details:
                try:
                    details = json.loads(attempt.details)
                    if "username" in details:
                        username_counts[details["username"]] = username_counts.get(details["username"], 0) + 1
                except (json.JSONDecodeError, TypeError):
                    pass
        
        return {
            "total_failed_attempts": len(failed_attempts),
            "unique_ips": len(ip_counts),
            "unique_usernames": len(username_counts),
            "top_ips": sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "top_usernames": sorted(username_counts.items(), key=lambda x: x[1], reverse=True)[:10],
            "time_period_hours": hours
        }
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address from request, considering proxy headers.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Client IP address
        """
        # Check for forwarded headers (common in proxy setups)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "Unknown"
    
    def _log_to_application_logger(self, audit_log: SecurityAuditLog) -> None:
        """
        Log audit events to application logger based on risk level.
        
        Args:
            audit_log: The audit log entry to log
        """
        message = f"Security Event: {audit_log.event_type} | Risk: {audit_log.risk_level} | IP: {audit_log.ip_address}"
        
        if audit_log.user_id:
            message += f" | User ID: {audit_log.user_id}"
        
        if audit_log.endpoint:
            message += f" | Endpoint: {audit_log.endpoint}"
        
        if audit_log.risk_level == SecurityRiskLevel.CRITICAL.value:
            logger.critical(message)
        elif audit_log.risk_level == SecurityRiskLevel.HIGH.value:
            logger.error(message)
        elif audit_log.risk_level == SecurityRiskLevel.MEDIUM.value:
            logger.warning(message)
        else:
            logger.info(message)


def get_audit_logger(db: Session) -> SecurityAuditLogger:
    """
    Factory function to create SecurityAuditLogger instance.
    
    Args:
        db: Database session
        
    Returns:
        SecurityAuditLogger instance
    """
    return SecurityAuditLogger(db)