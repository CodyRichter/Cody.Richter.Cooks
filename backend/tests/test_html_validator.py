"""
Tests for HTML validator utility.
"""
import pytest
from app.utils.html_validator import HTMLValidator, validate_recipe_description, validate_instruction_description


class TestHTMLValidator:
    """Test cases for HTMLValidator class."""
    
    def test_validate_html_content_with_allowed_tags(self):
        """Test validation with allowed HTML tags."""
        content = "<p>This is a <strong>test</strong> with <em>formatting</em>.</p>"
        result = HTMLValidator.validate_html_content(content)
        assert result == content
    
    def test_validate_html_content_with_disallowed_tags(self):
        """Test validation fails with disallowed HTML tags."""
        content = "<script>alert('xss')</script><p>Test</p>"
        with pytest.raises(ValueError, match="HTML tag 'script' is not allowed"):
            HTMLValidator.validate_html_content(content)
    
    def test_validate_html_content_empty_allowed(self):
        """Test validation allows empty content when configured."""
        assert HTMLValidator.validate_html_content(None, allow_empty=True) is None
        assert HTMLValidator.validate_html_content("", allow_empty=True) == ""
        assert HTMLValidator.validate_html_content("   ", allow_empty=True) == ""
    
    def test_validate_html_content_empty_not_allowed(self):
        """Test validation fails with empty content when not allowed."""
        with pytest.raises(ValueError, match="Content cannot be empty"):
            HTMLValidator.validate_html_content(None, allow_empty=False)
        
        with pytest.raises(ValueError, match="Content cannot be empty"):
            HTMLValidator.validate_html_content("", allow_empty=False)
        
        with pytest.raises(ValueError, match="Content cannot be empty"):
            HTMLValidator.validate_html_content("   ", allow_empty=False)
    
    def test_validate_html_content_custom_allowed_tags(self):
        """Test validation with custom allowed tags."""
        content = "<custom>Test</custom>"
        custom_tags = {"custom"}
        
        result = HTMLValidator.validate_html_content(content, allowed_tags=custom_tags)
        assert result == content
        
        # Should fail with default tags
        with pytest.raises(ValueError, match="HTML tag 'custom' is not allowed"):
            HTMLValidator.validate_html_content(content)
    
    def test_validate_html_content_case_insensitive(self):
        """Test validation is case insensitive for tags."""
        content = "<P>Test with <STRONG>uppercase</STRONG> tags.</P>"
        result = HTMLValidator.validate_html_content(content)
        assert result == content
    
    def test_validate_html_content_with_attributes(self):
        """Test validation works with tag attributes."""
        content = '<p class="test">Test with <a href="http://example.com">link</a>.</p>'
        result = HTMLValidator.validate_html_content(content)
        assert result == content
    
    def test_validate_html_content_nested_tags(self):
        """Test validation with nested HTML tags."""
        content = "<div><p>Nested <strong><em>formatting</em></strong> test.</p></div>"
        result = HTMLValidator.validate_html_content(content)
        assert result == content


class TestConvenienceFunctions:
    """Test cases for convenience validation functions."""
    
    def test_validate_recipe_description_allows_empty(self):
        """Test recipe description validation allows empty content."""
        assert validate_recipe_description(None) is None
        assert validate_recipe_description("") == ""
        assert validate_recipe_description("   ") == ""
    
    def test_validate_recipe_description_with_content(self):
        """Test recipe description validation with valid content."""
        content = "<p>A delicious <strong>recipe</strong> description.</p>"
        result = validate_recipe_description(content)
        assert result == content
    
    def test_validate_recipe_description_with_invalid_tags(self):
        """Test recipe description validation fails with invalid tags."""
        content = "<script>alert('xss')</script><p>Recipe</p>"
        with pytest.raises(ValueError, match="HTML tag 'script' is not allowed"):
            validate_recipe_description(content)
    
    def test_validate_instruction_description_requires_content(self):
        """Test instruction description validation requires content."""
        with pytest.raises(ValueError, match="Content cannot be empty"):
            validate_instruction_description("")
        
        with pytest.raises(ValueError, match="Content cannot be empty"):
            validate_instruction_description("   ")
    
    def test_validate_instruction_description_with_content(self):
        """Test instruction description validation with valid content."""
        content = "<p>Mix the <strong>ingredients</strong> thoroughly.</p>"
        result = validate_instruction_description(content)
        assert result == content
    
    def test_validate_instruction_description_with_invalid_tags(self):
        """Test instruction description validation fails with invalid tags."""
        content = "<script>alert('xss')</script><p>Instruction</p>"
        with pytest.raises(ValueError, match="HTML tag 'script' is not allowed"):
            validate_instruction_description(content)


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_validate_html_content_no_tags(self):
        """Test validation with plain text (no HTML tags)."""
        content = "This is plain text with no HTML tags."
        result = HTMLValidator.validate_html_content(content)
        assert result == content
    
    def test_validate_html_content_malformed_tags(self):
        """Test validation with malformed HTML tags."""
        # Unclosed tags should still be detected
        content = "<p>Unclosed paragraph"
        result = HTMLValidator.validate_html_content(content)
        assert result == content
        
        # Self-closing tags
        content = "<br/><img src='test.jpg'/>"
        result = HTMLValidator.validate_html_content(content)
        assert result == content
    
    def test_validate_html_content_mixed_case_tags(self):
        """Test validation with mixed case HTML tags."""
        content = "<P>Mixed <Strong>case</Strong> tags.</P>"
        result = HTMLValidator.validate_html_content(content)
        assert result == content