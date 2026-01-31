"""
Ingredient model for recipe ingredients.
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.models import Base
from app.utils.uuid_utils import SecureIDGenerator


class Ingredient(Base):
    """
    Ingredient model for storing recipe ingredients.

    Attributes:
        id: Primary key (secure string format)
        name: Name of the ingredient
        quantity: Quantity of the ingredient
        unit: Unit of measurement (cups, tablespoons, etc.)
        subtext: Additional notes or preparation instructions
        order_index: Order of ingredient in the recipe
        recipe_id: Foreign key to Recipe
    """

    __tablename__ = "ingredients"

    id = Column(String(15), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    quantity = Column(Float, nullable=False)  # Required quantity
    unit = Column(String(50), nullable=False)  # Required unit of measurement
    subtext = Column(
        String(255), nullable=True
    )  # Additional notes or preparation instructions
    order_index = Column(
        Integer, nullable=False, default=0
    )  # Order of ingredient in recipe
    recipe_id = Column(
        String(15),
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")

    # Database indices for optimized queries
    __table_args__ = (
        Index("idx_ingredient_recipe", "recipe_id"),
        Index("idx_ingredient_name", "name"),
        Index("idx_ingredient_recipe_order", "recipe_id", "order_index"),
    )

    def __init__(self, **kwargs):
        """Initialize Ingredient with auto-generated secure ID if not provided."""
        if "id" not in kwargs:
            kwargs["id"] = SecureIDGenerator.generate_id("ING")
        super().__init__(**kwargs)

    def __repr__(self) -> str:
        return f"<Ingredient(id='{self.id}', name='{self.name}', quantity={self.quantity}, unit='{self.unit}', order={self.order_index})>"
