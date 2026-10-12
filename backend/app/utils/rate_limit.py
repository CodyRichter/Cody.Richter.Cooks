"""
Per-instance, in-memory rate limiting for abuse-prone endpoints.
"""

from slowapi import Limiter

from app.core.config import settings
from app.utils.client_ip import get_client_ip

limiter = Limiter(key_func=get_client_ip, enabled=settings.rate_limit_enabled)
