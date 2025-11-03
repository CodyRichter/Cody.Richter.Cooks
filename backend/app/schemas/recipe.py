"""
Recipe Pydantic schemas for API serialization and validation.
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List
from app.utils.html_validator import validate_recipe_description


class RecipeDetail(BaseModel):
    """Unified recipe schema with optional fields for different use cases."""
    # Core fields
    title: str = Field(None, min_length=1, max_length=255, description="Recipe title")
    description: str = Field(None, description="HTML description with embedded images")
    tags: List[str] = Field([], description="Recipe tags for categorization")
    cooking_time: Optional[int] = Field(None, ge=1, description="Cooking time in minutes")
    serving_size: Optional[int] = Field(None, ge=1, description="Number of servings")
    
    # Nested relationships (for create/update operations)
    ingredients: List['IngredientSchema'] = Field([], description="Recipe ingredients")
    instructions: List['InstructionSchema'] = Field([], description="Recipe instructions")
    
    # Response-only fields
    id: str = Field(None, description="Recipe ID")
    created_at: datetime = Field(None, description="Creation timestamp")
    updated_at: datetime = Field(None, description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('description')
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        return validate_recipe_description(v)


class RecipeCreate(BaseModel):
    """Schema specifically for recipe creation with required fields."""
    title: str = Field(..., min_length=1, max_length=255, description="Recipe title")
    description: str = Field(..., description="HTML description with embedded images")
    tags: List[str] = Field(default_factory=list, description="Recipe tags for categorization")
    cooking_time: Optional[int] = Field(None, ge=1, description="Cooking time in minutes")
    serving_size: Optional[int] = Field(None, ge=1, description="Number of servings")
    
    # Nested relationships
    ingredients: List['IngredientSchema'] = Field(default_factory=list, description="Recipe ingredients")
    instructions:List['InstructionSchema'] = Field(default_factory=list, description="Recipe instructions")
    
    @field_validator('description')
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        return validate_recipe_description(v)

class RecipeSearchParams(BaseModel):
    """Schema for recipe search parameters."""
    q: Optional[str] = Field(None, description="Search query for title and ingredients")
    cooking_time_max: Optional[int] = Field(None, ge=1, description="Maximum cooking time filter")
    serving_size_min: Optional[int] = Field(None, ge=1, description="Minimum serving size filter")
    serving_size_max: Optional[int] = Field(None, ge=1, description="Maximum serving size filter")
    page: int = Field(1, ge=1, description="Page number for pagination")
    limit: int = Field(20, ge=1, le=100, description="Number of items per page")


class RecipeListItem(BaseModel):
    """Schema for recipe list items (summary view)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    cooking_time: Optional[int]
    serving_size: Optional[int]
    created_at: datetime


class RecipeList(BaseModel):
    """Paginated response for recipe lists."""
    items: List[RecipeListItem]
    has_next: bool
    has_prev: bool
    total: int
    page: int
    limit: int


# Import here to avoid circular imports
from app.schemas.ingredient import IngredientSchema
from app.schemas.instruction import InstructionSchema

# Resolve forward references
RecipeDetail.model_rebuild()