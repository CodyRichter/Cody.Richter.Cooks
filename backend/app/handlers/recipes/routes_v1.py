from typing import List, Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.handlers.recipes.impl_v1 import (
    create_recipe_internal,
    get_recipe_internal,
    list_recipes_internal,
    update_recipe_internal,
    delete_recipe_internal,
    list_recipe_permissions_internal,
    grant_recipe_permission_internal,
    revoke_recipe_permission_internal,
)
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeDetail, RecipeList
from app.schemas.recipe_permission import RecipePermissionDetail, GrantPermissionRequest
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/api/v1/recipes", tags=["recipes"])


@router.post("/", response_model=RecipeDetail, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new recipe. The current user becomes the owner.

    Args:
        recipe_data: Recipe creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created recipe information
    """
    return create_recipe_internal(recipe_data, current_user, db)


@router.get("/my-recipes", response_model=RecipeList)
async def get_my_recipes(
    current_user: User = Depends(get_current_active_user),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    """
    Get recipes for the authenticated user. Shows all recipes the user has permission to view.

    Args:
        current_user: Current authenticated user
        page: Page number for pagination
        limit: Number of items per page
        db: Database session

    Returns:
        List of recipe summaries for the current user
    """
    return list_recipes_internal(
        db=db,
        page=page,
        limit=limit,
        user_id_filter=current_user.id,
    )


@router.get("/{recipe_id}", response_model=RecipeDetail)
async def get_recipe(recipe_id: str, db: Session = Depends(get_db)):
    """
    Get a recipe by ID with all ingredients and instructions. Public endpoint - anyone can view recipes.

    Args:
        recipe_id: Recipe ID
        db: Database session

    Returns:
        Detailed recipe information with ingredients and instructions

    Raises:
        HTTPException: If recipe not found
    """
    return get_recipe_internal(recipe_id, db)


@router.put("/{recipe_id}", response_model=RecipeDetail)
async def update_recipe(
    recipe_id: str,
    recipe_data: RecipeDetail,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update a recipe. User must be owner or editor.

    Args:
        recipe_id: Recipe ID
        recipe_data: Recipe update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated recipe information

    Raises:
        HTTPException: If recipe not found or user doesn't have permission
    """
    return update_recipe_internal(recipe_id, recipe_data, current_user, db)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a recipe. Only the owner can delete a recipe.

    Args:
        recipe_id: Recipe ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If recipe not found or user is not the owner
    """
    delete_recipe_internal(recipe_id, current_user, db)


@router.get("/", response_model=RecipeList)
async def list_recipes(
    q: Optional[str] = Query(None, description="Search query for recipe title"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    """
    List recipes with pagination and search functionality.
    Public endpoint - anyone can view and search recipes.

    Args:
        q: Search query for recipe title (fuzzy search)
        page: Page number for pagination
        limit: Number of items per page
        db: Database session

    Returns:
        Paginated response with recipe summaries and metadata
    """
    return list_recipes_internal(
        db=db,
        page=page,
        limit=limit,
        title_search_query=q,
    )


@router.get("/user/{user_id}", response_model=RecipeList)
async def list_recipes_for_user(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: Session = Depends(get_db),
):
    """
    Get recipes for a specific user. Public endpoint - shows all recipes where the user is an owner.

    Args:
        user_id: User ID to get recipes for
        page: Page number for pagination
        limit: Number of items per page
        db: Database session

    Returns:
        List of recipe summaries for the specified user
    """
    return list_recipes_internal(
        db=db,
        page=page,
        limit=limit,
        user_id_filter=user_id,
    )


@router.post(
    "/{recipe_id}/permissions",
    response_model=RecipePermissionDetail,
    status_code=status.HTTP_201_CREATED,
)
async def grant_recipe_permission(
    recipe_id: str,
    permission_data: GrantPermissionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Grant permission to a user for a recipe. Only the owner can grant permissions.

    Args:
        recipe_id: Recipe ID
        permission_data: Permission grant data (username and role)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created permission information

    Raises:
        HTTPException: If recipe not found, user is not owner, or target user not found
    """
    return grant_recipe_permission_internal(
        recipe_id=recipe_id,
        target_username=permission_data.username,
        target_role=permission_data.role,
        current_user=current_user,
        db=db,
    )


@router.delete(
    "/{recipe_id}/permissions/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_recipe_permission(
    recipe_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Revoke permission from a user for a recipe. Only the owner can revoke permissions.
    The owner cannot revoke their own permission.

    Args:
        recipe_id: Recipe ID
        user_id: User ID of user that will have permission revoked
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If recipe not found, user is not owner, or permission not found
    """
    return revoke_recipe_permission_internal(
        recipe_id=recipe_id, target_user_id=user_id, current_user=current_user, db=db
    )


@router.get("/{recipe_id}/permissions", response_model=List[RecipePermissionDetail])
async def list_recipe_permissions(
    recipe_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List all permissions for a recipe. User must have permission to view the recipe.

    Args:
        recipe_id: Recipe ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of permissions with user details

    Raises:
        HTTPException: If recipe not found or user doesn't have permission
    """
    return list_recipe_permissions_internal(recipe_id, current_user, db)
