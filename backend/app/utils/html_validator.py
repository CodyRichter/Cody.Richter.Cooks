"""
Centralized HTML content validation utility.
"""
import re
from typing import Optional, Set


class HTMLValidator:
    """Centralized HTML content validator with configurable allowed tags."""
    
    DEFAULT_ALLOWED_TAGS = {
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'img', 'a', 'span', 'div', 'blockquote'
    }
    
    @classmethod
    def validate_html_content(
        cls, 
        content: Optional[str], 
        allowed_tags: Optional[Set[str]] = None,
        allow_empty: bool = True
    ) -> Optional[str]:
        """
        Validate HTML content against allowed tags.
        
        Args:
            content: HTML content to validate
            allowed_tags: Set of allowed HTML tags (uses default if None)
            allow_empty: Whether to allow empty/None content
            
        Returns:
            The validated content
            
        Raises:
            ValueError: If content contains disallowed tags or is empty when not allowed
        """
        if content is None:
            if allow_empty:
                return None
            raise ValueError("Content cannot be empty")
        
        content = content.strip()
        if not content:
            if allow_empty:
                return content
            raise ValueError("Content cannot be empty")
        
        # Use default allowed tags if none provided
        if allowed_tags is None:
            allowed_tags = cls.DEFAULT_ALLOWED_TAGS
        
        # Simple regex to find HTML tags
        tag_pattern = r'<(/?)(\w+)[^>]*>'
        tags = re.findall(tag_pattern, content.lower())
        
        for _, tag in tags:
            if tag not in allowed_tags:
                raise ValueError(f"HTML tag '{tag}' is not allowed")
        
        return content


# Convenience functions for common validation scenarios
def validate_recipe_description(content: Optional[str]) -> Optional[str]:
    """Validate HTML content for recipe descriptions (allows empty)."""
    return HTMLValidator.validate_html_content(content, allow_empty=True)


def validate_instruction_description(content: str) -> str:
    """Validate HTML content for instruction descriptions (requires content)."""
    result = HTMLValidator.validate_html_content(content, allow_empty=False)
    return result if result is not None else ""