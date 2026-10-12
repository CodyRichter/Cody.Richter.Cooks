"""
Tests for HTML sanitization utility.
"""

import pytest
from app.utils.html_validator import (
    sanitize_html,
    validate_recipe_description,
    validate_instruction_description,
)


@pytest.mark.unit
class TestSanitizeHTML:
    """Allowed rich text survives; anything executable is stripped."""

    @pytest.mark.parametrize(
        "content",
        [
            "<p>This is a <strong>test</strong> with <em>formatting</em>.</p>",
            "<div><p>Nested <strong><em>formatting</em></strong> test.</p></div>",
            '<ul><li>One</li></ul><ol start="3"><li>Three</li></ol>',
            "<p><mark>hi</mark> H<sub>2</sub>O x<sup>2</sup> <s>old</s> <u>u</u></p>",
            "<pre><code>code</code></pre><hr><blockquote>q</blockquote>",
            '<p style="text-align:center">Centered</p>',
            '<img src="https://example.com/a.webp" alt="Dish">',
            '<img src="data:image/webp;base64,AAAA">',
            "This is plain text with no HTML tags.",
        ],
    )
    def test_preserves_allowed_content(self, content):
        assert sanitize_html(content) == content

    def test_links_get_safe_rel(self):
        result = sanitize_html('<a href="https://example.com">link</a>')
        assert result == (
            '<a href="https://example.com" rel="noopener noreferrer">link</a>'
        )

    def test_normalizes_tag_case(self):
        assert (
            sanitize_html("<P>Up <STRONG>case</STRONG></P>")
            == "<p>Up <strong>case</strong></p>"
        )

    @pytest.mark.parametrize(
        "payload, forbidden",
        [
            ("<img src=x onerror=alert(1)>", "onerror"),
            ('<a href="javascript:alert(1)">x</a>', "javascript:"),
            ('<a href="JaVaScRiPt:alert(1)">x</a>', "alert"),
            ('<a href="data:text/html,<script>1</script>">x</a>', "data:"),
            ('<img src="data:image/svg+xml,<svg onload=alert(1)>">', "svg"),
            ("<svg onload=alert(1)><circle/></svg>", "onload"),
            ("<script>alert('xss')</script><p>Test</p>", "script"),
            ('<iframe src="https://evil.example"></iframe>', "iframe"),
            ('<p onclick="alert(1)">t</p>', "onclick"),
            ('<p style="background:url(javascript:alert(1))">t</p>', "background"),
            ("<style>body{display:none}</style><p>t</p>", "display"),
            ('<div><form action="https://evil.example"><input></form></div>', "form"),
        ],
    )
    def test_strips_xss_vectors(self, payload, forbidden):
        assert forbidden not in sanitize_html(payload).lower()


@pytest.mark.unit
class TestConvenienceFunctions:
    def test_recipe_description_allows_empty(self):
        assert validate_recipe_description(None) is None
        assert validate_recipe_description("") == ""
        assert validate_recipe_description("   ") == ""

    def test_recipe_description_strips_script(self):
        assert (
            validate_recipe_description("<script>alert('xss')</script><p>Recipe</p>")
            == "<p>Recipe</p>"
        )

    def test_instruction_description_requires_content(self):
        for content in ["", "   ", None, "<script>alert(1)</script>"]:
            with pytest.raises(ValueError, match="Content cannot be empty"):
                validate_instruction_description(content)

    def test_instruction_description_with_content(self):
        content = "<p>Mix the <strong>ingredients</strong> thoroughly.</p>"
        assert validate_instruction_description(content) == content
