"""
Helpers for validating user avatar uploads.
"""

from typing import Optional

MAX_AVATAR_BYTES = 2 * 1024 * 1024


def sniff_image_type(data: bytes) -> Optional[str]:
    """
    Identify an allowed avatar image type (png, jpeg, webp, gif) from magic bytes.

    The client-declared Content-Type and filename are never trusted.

    Returns:
        The MIME type, or None if the data is not one of the allowed formats.
    """
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None
