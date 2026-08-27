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
    cooking_time: Optional[int] = Field(
        None, ge=1, description="Cooking time in minutes"
    )
    serving_size: Optional[int] = Field(None, ge=1, description="Number of servings")

    # Nested relationships (for create/update operations)
    ingredients: List["IngredientSchema"] = Field([], description="Recipe ingredients")
    instructions: List["InstructionSchema"] = Field(
        [], description="Recipe instructions"
    )

    # Response-only fields
    id: str = Field(None, description="Recipe ID")
    created_at: datetime = Field(None, description="Creation timestamp")
    updated_at: datetime = Field(None, description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "R-1GL2S-18XXB",
                "title": "Classic Spaghetti Carbonara",
                "description": "<p>A traditional Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper.</p>",
                "tags": ["pasta", "italian", "dinner"],
                "cooking_time": 25,
                "serving_size": 4,
                "ingredients": [
                    {
                        "id": "I-98765-43210",
                        "name": "Spaghetti",
                        "quantity": 400.0,
                        "unit": "g",
                        "subtext": "bronze-die cut preferred",
                        "order_index": 0,
                        "recipe_id": "R-1GL2S-18XXB",
                    },
                    {
                        "id": "I-12345-67890",
                        "name": "Guanciale",
                        "quantity": 150.0,
                        "unit": "g",
                        "subtext": "diced into thick strips",
                        "order_index": 1,
                        "recipe_id": "R-1GL2S-18XXB",
                    },
                ],
                "instructions": [
                    {
                        "id": "S-11111-22222",
                        "title": "Boil Pasta",
                        "description": "<p>Bring a large pot of salted water to a rolling boil and cook spaghetti until al dente.</p>",
                        "step_number": 1,
                        "timing": 10,
                        "recipe_id": "R-1GL2S-18XXB",
                    },
                    {
                        "id": "S-33333-44444",
                        "title": "Crisp Guanciale & Toss",
                        "description": "<p>Crisp guanciale in a pan, toss hot pasta with whisked eggs and cheese off heat.</p>",
                        "step_number": 2,
                        "timing": 8,
                        "recipe_id": "R-1GL2S-18XXB",
                    },
                ],
                "created_at": "2026-01-15T12:00:00Z",
                "updated_at": "2026-01-15T12:30:00Z",
            }
        },
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        return validate_recipe_description(v)


class RecipeCreate(BaseModel):
    """Schema specifically for recipe creation with required fields."""

    title: str = Field(..., min_length=1, max_length=255, description="Recipe title")
    description: str = Field(..., description="HTML description with embedded images")
    tags: List[str] = Field(
        default_factory=list, description="Recipe tags for categorization"
    )
    cooking_time: Optional[int] = Field(
        None, ge=1, description="Cooking time in minutes"
    )
    serving_size: Optional[int] = Field(None, ge=1, description="Number of servings")

    # Nested relationships
    ingredients: List["IngredientSchema"] = Field(
        default_factory=list, description="Recipe ingredients"
    )
    instructions: List["InstructionSchema"] = Field(
        default_factory=list, description="Recipe instructions"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Classic Spaghetti Carbonara",
                "description": "<p>A traditional Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper.</p>",
                "tags": ["pasta", "italian", "dinner"],
                "cooking_time": 25,
                "serving_size": 4,
                "ingredients": [
                    {
                        "name": "Spaghetti",
                        "quantity": 400.0,
                        "unit": "g",
                        "subtext": "bronze-die cut preferred",
                        "order_index": 0,
                    },
                    {
                        "name": "Guanciale",
                        "quantity": 150.0,
                        "unit": "g",
                        "subtext": "diced into thick strips",
                        "order_index": 1,
                    },
                ],
                "instructions": [
                    {
                        "title": "Boil Pasta",
                        "description": "<p>Bring a large pot of salted water to a rolling boil and cook spaghetti until al dente.</p>",
                        "step_number": 1,
                        "timing": 10,
                    },
                    {
                        "title": "Crisp Guanciale & Toss",
                        "description": "<p>Crisp guanciale in a pan, toss hot pasta with whisked eggs and cheese off heat.</p>",
                        "step_number": 2,
                        "timing": 8,
                    },
                ],
            }
        }
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        return validate_recipe_description(v)


class RecipePatch(BaseModel):
    """Schema for partial recipe metadata updates."""

    title: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Recipe title"
    )
    description: Optional[str] = Field(
        None, description="HTML description with embedded images"
    )
    tags: Optional[List[str]] = Field(
        None, description="Recipe tags for categorization"
    )
    cooking_time: Optional[int] = Field(
        None, ge=1, description="Cooking time in minutes"
    )
    serving_size: Optional[int] = Field(None, ge=1, description="Number of servings")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Classic Spaghetti Carbonara (Updated)",
                "cooking_time": 30,
                "tags": ["pasta", "italian", "comfort-food"],
            }
        }
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator if provided."""
        if v is not None:
            return validate_recipe_description(v)
        return v


class RecipeSearchParams(BaseModel):
    """Schema for recipe search parameters."""

    q: Optional[str] = Field(None, description="Search query for title and ingredients")
    cooking_time_max: Optional[int] = Field(
        None, ge=1, description="Maximum cooking time filter"
    )
    serving_size_min: Optional[int] = Field(
        None, ge=1, description="Minimum serving size filter"
    )
    serving_size_max: Optional[int] = Field(
        None, ge=1, description="Maximum serving size filter"
    )
    page: int = Field(1, ge=1, description="Page number for pagination")
    limit: int = Field(20, ge=1, le=100, description="Number of items per page")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "q": "carbonara",
                "cooking_time_max": 30,
                "serving_size_min": 2,
                "serving_size_max": 6,
                "page": 1,
                "limit": 20,
            }
        }
    )


class RecipeListItem(BaseModel):
    """Schema for recipe list items (summary view)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "R-1GL2S-18XXB",
                "title": "Classic Spaghetti Carbonara",
                "cooking_time": 25,
                "serving_size": 4,
                "created_at": "2026-01-15T12:00:00Z",
            }
        },
    )

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

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "R-1GL2S-18XXB",
                        "title": "Classic Spaghetti Carbonara",
                        "cooking_time": 25,
                        "serving_size": 4,
                        "created_at": "2026-01-15T12:00:00Z",
                    }
                ],
                "has_next": False,
                "has_prev": False,
                "total": 1,
                "page": 1,
                "limit": 20,
            }
        }
    )


# Type alias
RecipeUpdate = RecipePatch

# Import here to avoid circular imports
from app.schemas.ingredient import IngredientSchema  # noqa: E402
from app.schemas.instruction import InstructionSchema  # noqa: E402

# Resolve forward references
RecipeDetail.model_rebuild()
