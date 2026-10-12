"""
Client IP resolution behind Cloud Run's proxy.
"""

from fastapi import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """
    Return the caller's IP address.

    Clients can prepend arbitrary values to X-Forwarded-For, so the address is
    read from the right: Google's front end appends the real client IP, and
    `forwarded_for_trusted_hops` counts the proxies that append after it.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        hops = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
        if hops:
            index = max(len(hops) - settings.forwarded_for_trusted_hops, 0)
            return hops[index]

    if request.client:
        return request.client.host

    return "Unknown"
