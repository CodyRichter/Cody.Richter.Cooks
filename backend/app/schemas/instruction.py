"""
Instruction Pydantic schemas for API serialization and validation.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from app.utils.html_validator import validate_instruction_description


class InstructionSchema(BaseModel):
    """Unified instruction schema with optional fields for different use cases."""

    # Core fields
    title: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Title of the instruction step"
    )
    description: Optional[str] = Field(
        None, min_length=1, description="HTML description of the instruction step"
    )
    step_number: Optional[int] = Field(
        None, ge=1, description="Order of the instruction step"
    )
    timing: Optional[int] = Field(
        None, ge=1, description="Optional timing for this step in minutes"
    )

    # Relationship fields
    recipe_id: Optional[str] = Field(
        None, description="ID of the recipe this instruction belongs to"
    )

    # Response-only fields
    id: Optional[str] = Field(None, description="Instruction ID")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "S-11111-22222",
                "title": "Preheat Oven & Prepare Pan",
                "description": "<p>Preheat oven to 375°F (190°C). Grease a 9x13-inch baking pan with butter.</p>",
                "step_number": 1,
                "timing": 10,
                "recipe_id": "R-1GL2S-18XXB",
            }
        },
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        if v is not None:
            return validate_instruction_description(v)
        return v


class InstructionCreate(BaseModel):
    """Schema for adding a single instruction step."""

    title: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Title of the instruction step"
    )
    description: str = Field(
        ..., min_length=1, description="HTML description of the instruction step"
    )
    step_number: Optional[int] = Field(
        None,
        ge=1,
        description="Order of the instruction step (auto-assigned if omitted)",
    )
    timing: Optional[int] = Field(
        None, ge=1, description="Optional timing for this step in minutes"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Season with Black Pepper",
                "description": "<p>Grind generous amounts of fresh black pepper over the pasta and serve immediately.</p>",
                "step_number": 3,
                "timing": 2,
            }
        }
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        if v is not None:
            return validate_instruction_description(v)
        return v


class InstructionPatch(BaseModel):
    """Schema for partially updating an instruction step."""

    title: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Title of the instruction step"
    )
    description: Optional[str] = Field(
        None, min_length=1, description="HTML description of the instruction step"
    )
    step_number: Optional[int] = Field(
        None, ge=1, description="Order of the instruction step"
    )
    timing: Optional[int] = Field(
        None, ge=1, description="Optional timing for this step in minutes"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Crisp Guanciale & Toss Thoroughly",
                "timing": 10,
                "description": "<p>Crisp guanciale in a pan until golden and rendered, toss hot pasta off heat.</p>",
            }
        }
    )

    @field_validator("description")
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        if v is not None:
            return validate_instruction_description(v)
        return v


class InstructionListCreate(BaseModel):
    """Schema for creating multiple instructions at once."""

    instructions: List[InstructionSchema] = Field(
        ..., description="List of instructions to create"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "instructions": [
                    {
                        "title": "Preheat Oven",
                        "description": "<p>Preheat oven to 375°F (190°C).</p>",
                        "step_number": 1,
                        "timing": 10,
                    },
                    {
                        "title": "Mix Dry Ingredients",
                        "description": "<p>Whisk flour, baking powder, and salt in a bowl.</p>",
                        "step_number": 2,
                        "timing": 5,
                    },
                ]
            }
        }
    )


class InstructionListResponse(BaseModel):
    """Schema for multiple instruction responses."""

    instructions: List[InstructionSchema] = Field(
        ..., description="List of instructions"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "instructions": [
                    {
                        "id": "S-11111-22222",
                        "title": "Preheat Oven",
                        "description": "<p>Preheat oven to 375°F (190°C).</p>",
                        "step_number": 1,
                        "timing": 10,
                        "recipe_id": "R-1GL2S-18XXB",
                    }
                ]
            }
        }
    )


# Convenience type aliases for clarity
InstructionUpdate = InstructionPatch
InstructionResponse = InstructionSchema
