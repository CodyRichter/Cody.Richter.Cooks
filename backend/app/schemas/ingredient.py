"""
Ingredient Pydantic schemas for API serialization and validation.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class IngredientSchema(BaseModel):
    """Unified ingredient schema with optional fields for different use cases."""

    # Core fields
    name: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Name of the ingredient"
    )
    quantity: Optional[float] = Field(
        None, ge=0, description="Quantity of the ingredient"
    )
    unit: Optional[str] = Field(
        None, min_length=1, max_length=50, description="Unit of measurement"
    )
    subtext: Optional[str] = Field(
        None,
        max_length=255,
        description="Additional ingredient notes or preparation instructions",
    )
    order_index: Optional[int] = Field(
        None, ge=0, description="Order of ingredient in the recipe"
    )

    # Relationship fields
    recipe_id: Optional[str] = Field(
        None, description="ID of the recipe this ingredient belongs to"
    )

    # Response-only fields
    id: Optional[str] = Field(None, description="Ingredient ID")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "I-98765-43210",
                "name": "All-purpose flour",
                "quantity": 2.5,
                "unit": "cups",
                "subtext": "sifted before measuring",
                "order_index": 0,
                "recipe_id": "R-1GL2S-18XXB",
            }
        },
    )


class IngredientListCreate(BaseModel):
    """Schema for creating multiple ingredients at once."""

    ingredients: List[IngredientSchema] = Field(
        ..., description="List of ingredients to create"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ingredients": [
                    {
                        "name": "All-purpose flour",
                        "quantity": 2.5,
                        "unit": "cups",
                        "subtext": "sifted",
                        "order_index": 0,
                    },
                    {
                        "name": "Granulated sugar",
                        "quantity": 1.0,
                        "unit": "cups",
                        "order_index": 1,
                    },
                ]
            }
        }
    )


class IngredientListResponse(BaseModel):
    """Schema for multiple ingredient responses."""

    ingredients: List[IngredientSchema] = Field(..., description="List of ingredients")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ingredients": [
                    {
                        "id": "I-98765-43210",
                        "name": "All-purpose flour",
                        "quantity": 2.5,
                        "unit": "cups",
                        "subtext": "sifted",
                        "order_index": 0,
                        "recipe_id": "R-1GL2S-18XXB",
                    }
                ]
            }
        }
    )


# Convenience type aliases for clarity
IngredientCreate = IngredientSchema
IngredientUpdate = IngredientSchema
IngredientResponse = IngredientSchema
