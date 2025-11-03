"""
RecipePermission model for managing user-recipe access relationships.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING
import enum

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.recipe import Recipe


class PermissionRole(str, enum.Enum):
    """Enumeration for recipe permission roles."""
    OWNER = "owner"
    EDITOR = "editor"


class RecipePermission(Base):
    """
    Simplified RecipePermission model for many-to-many user-recipe relationships.
    
    Attributes:
        id: Primary key (secure string format)
        user_id: Foreign key to User
        recipe_id: Foreign key to Recipe
        role: Permission role (owner, editor)
        granted_at: Timestamp when permission was granted
    """
    __tablename__ = "recipe_permissions"
    
    id = Column(String(17), primary_key=True, index=True)  # RP- prefix makes it longer
    user_id = Column(String(15), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(String(15), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(PermissionRole), nullable=False, default=PermissionRole.EDITOR)
    granted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="recipe_permissions")
    recipe = relationship("Recipe", back_populates="user_permissions")
    
    # Database constraints and indices
    __table_args__ = (
        UniqueConstraint('user_id', 'recipe_id', name='uq_user_recipe_permission'),
        Index('idx_permission_user_recipe', 'user_id', 'recipe_id'),
    )
    
    def __init__(self, **kwargs):
        """Initialize RecipePermission with auto-generated secure ID if not provided."""
        if 'id' not in kwargs:
            kwargs['id'] = SecureIDGenerator.generate_id('RP')
        super().__init__(**kwargs)
    
    def __repr__(self) -> str:
        return f"<RecipePermission(user_id={self.user_id}, recipe_id={self.recipe_id}, role='{self.role}')>"
