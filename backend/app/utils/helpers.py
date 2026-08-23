from typing import List, Optional, TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.recipe_permission import RecipePermission, PermissionRole

if TYPE_CHECKING:
    from app.models.user import User


def get_user_recipe_permission(
    db: Session, user_id: str, recipe_id: str
) -> Optional[RecipePermission]:
    """
    Get user's permission for a specific recipe.

    Args:
        db: Database session
        user_id: User ID
        recipe_id: Recipe ID

    Returns:
        RecipePermission object if user has permission, None otherwise
    """
    return (
        db.query(RecipePermission)
        .filter(
            and_(
                RecipePermission.user_id == user_id,
                RecipePermission.recipe_id == recipe_id,
            )
        )
        .first()
    )


def enforce_recipe_permissions(
    db: Session, user: "User", recipe_id: str, required_roles: List[PermissionRole]
) -> RecipePermission:
    """
    Check if user has required permission for a recipe.

    Args:
        db: Database session
        user: Current user
        recipe_id: Recipe ID to check permission for
        required_roles: List of roles that are allowed

    Returns:
        RecipePermission object if user has permission

    Raises:
        HTTPException: If user doesn't have required permission
    """
    permission = get_user_recipe_permission(db, user.id, recipe_id)

    # Administrators have full access without specific permissions
    if getattr(user, "is_admin", False):
        if permission:
            return permission
        return RecipePermission(
            user_id=user.id, recipe_id=recipe_id, role=PermissionRole.OWNER
        )

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found or access denied",
        )

    if permission.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this operation",
        )

    return permission
