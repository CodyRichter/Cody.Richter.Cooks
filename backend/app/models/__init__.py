"""
Database models package.
"""

# Import Base from database core for model inheritance
from app.core.database import Base

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.models.ingredient import Ingredient
from app.models.instruction import Instruction
from app.models.security_audit_log import (
    SecurityAuditLog,
    SecurityEventType,
    SecurityRiskLevel,
)

__all__ = [
    "Base",
    "User",
    "Recipe",
    "RecipePermission",
    "PermissionRole",
    "Ingredient",
    "Instruction",
    "SecurityAuditLog",
    "SecurityEventType",
    "SecurityRiskLevel",
]
