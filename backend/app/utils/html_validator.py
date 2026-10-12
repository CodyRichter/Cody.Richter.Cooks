"""
Centralized HTML sanitization for user-authored rich text.

Content is rendered as raw HTML on the frontend, so everything outside the
allowlists below (tags, attributes, URL schemes, inline styles) is stripped.
"""

from typing import Optional

import nh3

ALLOWED_TAGS = {
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "mark",
    "sub",
    "sup",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "img",
    "a",
    "span",
    "div",
    "blockquote",
}

_ALIGNABLE_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6"}

ALLOWED_ATTRIBUTES = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "ol": {"start"},
    **{tag: {"style"} for tag in _ALIGNABLE_TAGS},
}

ALLOWED_URL_SCHEMES = {"http", "https", "mailto", "data"}
ALLOWED_STYLE_PROPERTIES = {"text-align"}
_DATA_IMAGE_PREFIXES = (
    "data:image/png",
    "data:image/jpeg",
    "data:image/gif",
    "data:image/webp",
)


def _filter_attribute(tag: str, attribute: str, value: str) -> Optional[str]:
    """Restrict `data:` URLs to raster images inside <img src>."""
    if value.strip().lower().startswith("data:"):
        if tag == "img" and attribute == "src":
            return value if value.lower().startswith(_DATA_IMAGE_PREFIXES) else None
        return None
    return value


def sanitize_html(content: str) -> str:
    return nh3.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        filter_style_properties=ALLOWED_STYLE_PROPERTIES,
        attribute_filter=_filter_attribute,
        link_rel="noopener noreferrer",
        strip_comments=True,
    ).strip()


def validate_recipe_description(content: Optional[str]) -> Optional[str]:
    """Sanitize HTML for recipe descriptions (allows empty)."""
    if content is None:
        return None
    return sanitize_html(content)


def validate_instruction_description(content: Optional[str]) -> str:
    """Sanitize HTML for instruction descriptions (requires content)."""
    sanitized = sanitize_html(content or "")
    if not sanitized:
        raise ValueError("Content cannot be empty")
    return sanitized
