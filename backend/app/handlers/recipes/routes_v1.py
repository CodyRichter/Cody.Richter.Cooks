"""
Recipe API routes - Version 1.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate,
    RecipeDetail,
    RecipePatch,
    RecipeList,
)
from app.schemas.instruction import (
    InstructionCreate,
    InstructionPatch,
    InstructionSchema,
)
from app.schemas.ingredient import (
    IngredientCreate,
    IngredientPatch,
    IngredientSchema,
)
from app.schemas.recipe_permission import (
    RecipePermissionDetail,
    GrantPermissionRequest,
)
from app.utils.auth import get_current_active_user, get_current_user_optional
from app.handlers.recipes.impl_v1 import (
    create_recipe_internal,
    update_recipe_internal,
    patch_recipe_internal,
    delete_recipe_internal,
    get_recipe_internal,
    list_recipes_internal,
    list_recipe_permissions_internal,
    grant_recipe_permission_internal,
    revoke_recipe_permission_internal,
    add_instruction_internal,
    patch_instruction_internal,
    delete_instruction_internal,
    add_ingredient_internal,
    patch_ingredient_internal,
    delete_ingredient_internal,
)

router = APIRouter(prefix="/api/v1/recipes", tags=["recipes"])


@router.post(
    "/",
    response_model=RecipeDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new recipe",
    description="Create a complete recipe with initial metadata, optional ingredients, and optional instructions. The authenticated caller is automatically assigned as the recipe owner. Use this tool when authoring a new recipe from scratch.",
)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new recipe with ingredients and instructions.

    Args:
        recipe_data: Recipe creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created recipe with ingredients and instructions
    """
    return create_recipe_internal(recipe_data, current_user, db)


@router.get(
    "/my-recipes/",
    response_model=RecipeList,
    summary="List recipes owned by the authenticated user",
    description="Retrieve a paginated list of all recipes where the authenticated user is the owner or editor. Requires authentication. Use this tool to list the user's personal recipe collection.",
)
async def get_my_recipes(
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get recipes belonging to the current user (where user is owner or editor).
    Requires authentication.

    Args:
        page: Page number for pagination
        limit: Number of items per page
        current_user: Current authenticated user
        db: Database session

    Returns:
        Paginated list of user's recipes
    """
    return list_recipes_internal(
        db=db,
        user_id_filter=current_user.id,
        page=page,
        limit=limit,
    )


@router.get(
    "/{recipe_id}/",
    response_model=RecipeDetail,
    summary="Get recipe details by ID",
    description="Retrieve full details for a single recipe by its ID, including complete ingredient lists, ordered instruction steps, metadata, and timestamps. Public endpoint. Use this tool when you have a recipe ID and need its full recipe instructions or ingredient breakdown.",
)
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


@router.put(
    "/{recipe_id}/",
    response_model=RecipeDetail,
    summary="Update entire recipe",
    description="Update all details of an existing recipe by ID. Caller must be the recipe owner or an editor. Use this tool to replace or update recipe metadata, tags, ingredients, or instructions.",
)
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


@router.patch(
    "/{recipe_id}/",
    response_model=RecipeDetail,
    summary="Partially update recipe metadata",
    description="Update specific metadata fields of a recipe (such as title, description, tags, cooking time, or serving size) without affecting its ingredients or instructions. Caller must be the recipe owner or an editor. Use this tool for targeted metadata changes or real-time auto-saving.",
)
async def patch_recipe(
    recipe_id: str,
    patch_data: RecipePatch,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Partially update recipe metadata without overwriting nested ingredients or instructions.

    Args:
        recipe_id: Recipe ID
        patch_data: Recipe metadata patch data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated recipe information
    """
    return patch_recipe_internal(recipe_id, patch_data, current_user, db)


@router.delete(
    "/{recipe_id}/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete recipe by ID",
    description="Permanently delete a recipe and all associated ingredients, instructions, and permissions. Only the recipe owner can perform this operation. Use this tool when a user explicitly requests deleting a recipe.",
)
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


# --- Granular Instruction Endpoints ---


@router.post(
    "/{recipe_id}/instructions/",
    response_model=InstructionSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Add an instruction step to a recipe",
    description="Add a single instruction step to an existing recipe. If step_number is omitted, it will automatically append to the end of the instructions list. Caller must be the recipe owner or an editor. Use this tool to insert a new step without re-sending the whole recipe.",
)
async def add_instruction(
    recipe_id: str,
    instruction_data: InstructionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Add a single instruction step to a recipe.
    """
    return add_instruction_internal(recipe_id, instruction_data, current_user, db)


@router.patch(
    "/{recipe_id}/instructions/{step_or_id}/",
    response_model=InstructionSchema,
    summary="Update an instruction step",
    description="Update fields of a specific instruction step identified by either instruction ID (e.g. 'INS-12345') or step number (e.g. '1', '2'). Caller must be the recipe owner or an editor. Use this tool to update instruction title, description, or timing.",
)
async def patch_instruction(
    recipe_id: str,
    step_or_id: str,
    instruction_data: InstructionPatch,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Partially update a single instruction step by ID or step number.
    """
    return patch_instruction_internal(
        recipe_id, step_or_id, instruction_data, current_user, db
    )


@router.delete(
    "/{recipe_id}/instructions/{step_or_id}/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an instruction step",
    description="Remove a specific instruction step from a recipe by instruction ID or step number. Remaining steps are automatically re-sequenced. Caller must be the recipe owner or an editor. Use this tool to remove a step.",
)
async def delete_instruction(
    recipe_id: str,
    step_or_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a single instruction step by ID or step number.
    """
    delete_instruction_internal(recipe_id, step_or_id, current_user, db)


# --- Granular Ingredient Endpoints ---


@router.post(
    "/{recipe_id}/ingredients/",
    response_model=IngredientSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Add an ingredient to a recipe",
    description="Add a single ingredient to an existing recipe. If order_index is omitted, it will automatically append to the end of the ingredient list. Caller must be the recipe owner or an editor. Use this tool to add an ingredient without replacing the entire recipe.",
)
async def add_ingredient(
    recipe_id: str,
    ingredient_data: IngredientCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Add a single ingredient to a recipe.
    """
    return add_ingredient_internal(recipe_id, ingredient_data, current_user, db)


@router.patch(
    "/{recipe_id}/ingredients/{ingredient_id}/",
    response_model=IngredientSchema,
    summary="Update an ingredient",
    description="Update fields of a specific ingredient identified by ingredient ID (e.g. 'I-12345') or order index. Caller must be the recipe owner or an editor. Use this tool to update ingredient quantity, unit, name, or notes.",
)
async def patch_ingredient(
    recipe_id: str,
    ingredient_id: str,
    ingredient_data: IngredientPatch,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Partially update a single ingredient by ID or order index.
    """
    return patch_ingredient_internal(
        recipe_id, ingredient_id, ingredient_data, current_user, db
    )


@router.delete(
    "/{recipe_id}/ingredients/{ingredient_id}/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an ingredient",
    description="Remove a specific ingredient from a recipe by ingredient ID or order index. Remaining ingredients are automatically re-indexed. Caller must be the recipe owner or an editor. Use this tool to remove an ingredient.",
)
async def delete_ingredient(
    recipe_id: str,
    ingredient_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a single ingredient by ID or order index.
    """
    delete_ingredient_internal(recipe_id, ingredient_id, current_user, db)


# --- Recipe List & Permission Endpoints ---


@router.get(
    "/",
    response_model=RecipeList,
    summary="Search and list public recipes",
    description="Search and browse public recipes with pagination. Supports fuzzy search on recipe titles using the 'q' parameter. Use this tool for recipe discovery, browsing, or title searching.",
)
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


@router.get(
    "/user/{user_id}/",
    response_model=RecipeList,
    summary="List recipes by author user ID",
    description="Retrieve a paginated list of public recipes created by a specific user ID. Use this tool to explore all recipes authored by a specific user.",
)
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
    "/{recipe_id}/permissions/",
    response_model=RecipePermissionDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Grant recipe permission to user",
    description="Grant 'editor' or 'owner' permission for a recipe to another user by their username. Only the recipe owner can grant permissions. Use this tool when sharing collaborative recipe editing access.",
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


@router.get(
    "/{recipe_id}/permissions/",
    response_model=List[RecipePermissionDetail],
    summary="List users with permission for recipe",
    description="Retrieve the list of users with access permissions to this recipe. Recipe owners and editors see all collaborators including emails; public users see only the owner.",
)
async def list_recipe_permissions(
    recipe_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    List all permissions for a recipe.
    Public endpoint - anyone can see who has permissions, but sensitive details
    like email are only shown to users with recipe access (owner/editor).

    Args:
        recipe_id: Recipe ID
        current_user: Current authenticated user (optional)
        db: Database session

    Returns:
        List of recipe permissions with user information

    Raises:
        HTTPException: If recipe not found
    """
    return list_recipe_permissions_internal(recipe_id, current_user, db)


@router.delete(
    "/{recipe_id}/permissions/{target_user_id}/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke recipe permission from user",
    description="Revoke an editor or co-owner's permission from a recipe. Only the recipe owner can revoke permissions, and owners cannot revoke their own primary ownership. Use this tool when managing recipe collaborators.",
)
async def revoke_recipe_permission(
    recipe_id: str,
    target_user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Revoke permission from a user for a recipe. Only the owner can revoke permissions.

    Args:
        recipe_id: Recipe ID
        target_user_id: User ID to revoke permission from
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If recipe not found, user is not owner, target user not found, or trying to revoke own permission
    """
    revoke_recipe_permission_internal(recipe_id, target_user_id, current_user, db)
