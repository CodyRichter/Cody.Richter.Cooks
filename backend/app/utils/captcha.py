"""
Utility for validating Cloudflare Turnstile captchas.
"""

import httpx
from app.core.config import settings


async def verify_turnstile_token(token: str) -> bool:
    """
    Verifies a Cloudflare Turnstile token.
    Returns True if valid, False otherwise.
    """
    # If the default secret key is set, assume we are in a testing environment
    if settings.turnstile_secret_key == "1x0000000000000000000000000000000AA":
        print("[Captcha] Using test Turnstile secret key, bypassing validation.")
        return True

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    data = {"secret": settings.turnstile_secret_key, "response": token}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, data=data)
            result = response.json()
            return result.get("success", False)
        except Exception as e:
            print(f"[Captcha] Error validating Turnstile token: {e}")
            return False
