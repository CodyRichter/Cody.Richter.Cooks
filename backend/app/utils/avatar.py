"""
Helpers for validating and normalizing user avatar uploads.
"""

import io
from typing import Optional, Tuple

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_AVATAR_BYTES = 10 * 1024 * 1024
MAX_AVATAR_DIMENSION = 512
MAX_IMAGE_PIXELS = 50_000_000
AVATAR_OUTPUT_TYPE = "image/webp"
AVATAR_WEBP_QUALITY = 85

# Pillow warns above this and raises DecompressionBombError at twice this value.
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


class InvalidAvatarError(Exception):
    """The upload could not be decoded as a safe, reasonably sized image."""


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


def normalize_avatar(data: bytes) -> Tuple[bytes, str]:
    """
    Decode an uploaded image and re-encode it as a small, metadata-free WebP.

    EXIF orientation is applied, the longest side is capped at
    MAX_AVATAR_DIMENSION (never upscaling), animated images keep only their
    first frame, and all metadata (EXIF, ICC, XMP, comments) is dropped.

    Raises:
        InvalidAvatarError: if the data is corrupt, undecodable, or too many pixels.

    Returns:
        The WebP bytes and their content type.
    """
    try:
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
            if width * height > MAX_IMAGE_PIXELS:
                raise InvalidAvatarError("Image dimensions are too large")

            image.thumbnail(
                (MAX_AVATAR_DIMENSION, MAX_AVATAR_DIMENSION), Image.Resampling.LANCZOS
            )
            image = ImageOps.exif_transpose(image)

            mode = "RGBA" if image.has_transparency_data else "RGB"
            if image.mode != mode:
                image = image.convert(mode)

            output = io.BytesIO()
            image.save(output, format="WEBP", quality=AVATAR_WEBP_QUALITY)
    except Image.DecompressionBombError as exc:
        raise InvalidAvatarError("Image dimensions are too large") from exc
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, EOFError) as exc:
        raise InvalidAvatarError("Image could not be decoded") from exc

    return output.getvalue(), AVATAR_OUTPUT_TYPE
