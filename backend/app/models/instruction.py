"""
Instruction model for recipe step-by-step instructions.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator

if TYPE_CHECKING:
    pass


class Instruction(Base):
    """
    Instruction model for storing recipe step-by-step instructions.

    Attributes:
        id: Primary key (secure string format)
        title: Title of the instruction step
        description: HTML description of the instruction step
        step_number: Order of the instruction step
        timing: Optional timing for this step in minutes
        recipe_id: Foreign key to Recipe
    """

    __tablename__ = "instructions"

    id = Column(String(15), primary_key=True, index=True)
    title = Column(String(255), nullable=False)  # Title of the instruction step
    description = Column(Text, nullable=False)  # HTML content with embedded images
    step_number = Column(Integer, nullable=False)
    timing = Column(Integer, nullable=True)  # Optional timing in minutes
    recipe_id = Column(
        String(15),
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    recipe = relationship("Recipe", back_populates="instructions")

    # Database indices for optimized queries
    __table_args__ = (Index("idx_instruction_recipe_step", "recipe_id", "step_number"),)

    def __init__(self, **kwargs):
        """Initialize Instruction with auto-generated secure ID if not provided."""
        if "id" not in kwargs:
            kwargs["id"] = SecureIDGenerator.generate_id("INS")
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<Instruction(id='{self.id}', title='{self.title}', recipe_id={self.recipe_id}, step_number={self.step_number})>"
