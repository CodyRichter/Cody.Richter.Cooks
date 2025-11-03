"""
Recipe model for storing recipe information with rich content support.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING, List

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator

if TYPE_CHECKING:
    from app.models.recipe_permission import RecipePermission
    from app.models.ingredient import Ingredient
    from app.models.instruction import Instruction


class Recipe(Base):
    """
    Recipe model with rich content support and relationships.
    
    Attributes:
        id: Primary key (secure string format)
        title: Recipe title
        description: HTML description with embedded images
        tags: Recipe tags for categorization (JSON array)
        cooking_time: Cooking time in minutes
        serving_size: Number of servings
        created_at: Timestamp when recipe was created
        updated_at: Timestamp when recipe was last updated
    """
    __tablename__ = "recipes"
    
    id = Column(String(15), primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)  # HTML content with embedded images
    tags = Column(JSON, nullable=False, default=list)  # Recipe tags as JSON array
    cooking_time = Column(Integer, nullable=True)  # in minutes
    serving_size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user_permissions = relationship("RecipePermission", back_populates="recipe", cascade="all, delete-orphan")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    instructions = relationship("Instruction", back_populates="recipe", cascade="all, delete-orphan")
    
    # Database indices for optimized queries
    __table_args__ = (
        Index('idx_recipe_title_search', 'title'),
        Index('idx_recipe_created_at', 'created_at'),
        Index('idx_recipe_cooking_time', 'cooking_time'),
    )
    
    def __init__(self, **kwargs):
        """Initialize Recipe with auto-generated secure ID if not provided."""
        if 'id' not in kwargs:
            kwargs['id'] = SecureIDGenerator.generate_id('R')
        super().__init__(**kwargs)
    
    def __repr__(self) -> str:
        return f"<Recipe(id={self.id}, title='{self.title}', cooking_time={self.cooking_time})>"