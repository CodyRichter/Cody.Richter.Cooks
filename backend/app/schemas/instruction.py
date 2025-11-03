"""
Instruction Pydantic schemas for API serialization and validation.
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from app.utils.html_validator import validate_instruction_description


class InstructionSchema(BaseModel):
    """Unified instruction schema with optional fields for different use cases."""
    # Core fields
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Title of the instruction step")
    description: Optional[str] = Field(None, min_length=1, description="HTML description of the instruction step")
    step_number: Optional[int] = Field(None, ge=1, description="Order of the instruction step")
    timing: Optional[int] = Field(None, ge=1, description="Optional timing for this step in minutes")
    
    # Relationship fields
    recipe_id: Optional[str] = Field(None, description="ID of the recipe this instruction belongs to")
    
    # Response-only fields
    id: Optional[str] = Field(None, description="Instruction ID")
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('description')
    @classmethod
    def validate_html_content(cls, v):
        """Validate HTML content using centralized validator."""
        if v is not None:
            return validate_instruction_description(v)
        return v


class InstructionListCreate(BaseModel):
    """Schema for creating multiple instructions at once."""
    instructions: List[InstructionSchema] = Field(..., description="List of instructions to create")


class InstructionListResponse(BaseModel):
    """Schema for multiple instruction responses."""
    instructions: List[InstructionSchema] = Field(..., description="List of instructions")


# Convenience type aliases for clarity
InstructionCreate = InstructionSchema
InstructionUpdate = InstructionSchema
InstructionResponse = InstructionSchema