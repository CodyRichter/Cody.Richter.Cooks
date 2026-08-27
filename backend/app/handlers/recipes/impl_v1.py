from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func

from app.core.config import settings
from app.models.ingredient import Ingredient
from app.models.instruction import Instruction
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate,
    RecipeDetail,
    RecipePatch,
    RecipeListItem,
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
from app.schemas.recipe_permission import RecipePermissionDetail
from app.utils.helpers import enforce_recipe_permissions, get_user_recipe_permission


def create_recipe_internal(
    recipe_data: RecipeCreate, current_user: User, db: Session
) -> RecipeDetail:
    db_recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        tags=recipe_data.tags,
        cooking_time=recipe_data.cooking_time,
        serving_size=recipe_data.serving_size,
    )

    db.add(db_recipe)
    db.flush()  # Flush to get the recipe ID

    if recipe_data.ingredients:
        for ingredient_data in recipe_data.ingredients:
            db_ingredient = Ingredient(
                name=ingredient_data.name,
                quantity=ingredient_data.quantity,
                unit=ingredient_data.unit,
                subtext=ingredient_data.subtext,
                order_index=ingredient_data.order_index,
                recipe_id=db_recipe.id,
            )
            db.add(db_ingredient)

    if recipe_data.instructions:
        for instruction_data in recipe_data.instructions:
            db_instruction = Instruction(
                title=instruction_data.title,
                description=instruction_data.description,
                step_number=instruction_data.step_number,
                timing=instruction_data.timing,
                recipe_id=db_recipe.id,
            )
            db.add(db_instruction)

    owner_permission = RecipePermission(
        user_id=current_user.id, recipe_id=db_recipe.id, role=PermissionRole.OWNER
    )

    db.add(owner_permission)
    db.commit()
    db.refresh(db_recipe)

    return RecipeDetail.model_validate(db_recipe)


def update_recipe_internal(
    recipe_id: str, recipe_data: RecipeDetail, current_user: User, db: Session
):
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    update_data = recipe_data.model_dump(
        exclude_unset=True, exclude={"ingredients", "instructions"}
    )
    for field, value in update_data.items():
        setattr(recipe, field, value)

    if recipe_data.ingredients is not None:
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        for ingredient_data in recipe_data.ingredients:
            db_ingredient = Ingredient(
                name=ingredient_data.name,
                quantity=ingredient_data.quantity,
                unit=ingredient_data.unit,
                subtext=ingredient_data.subtext,
                order_index=ingredient_data.order_index,
                recipe_id=recipe_id,
            )
            db.add(db_ingredient)

    if recipe_data.instructions is not None:
        db.query(Instruction).filter(Instruction.recipe_id == recipe_id).delete()
        for instruction_data in recipe_data.instructions:
            db_instruction = Instruction(
                title=instruction_data.title,
                description=instruction_data.description,
                step_number=instruction_data.step_number,
                timing=instruction_data.timing,
                recipe_id=recipe_id,
            )
            db.add(db_instruction)

    db.commit()
    db.refresh(recipe)

    return RecipeDetail.model_validate(recipe)


def patch_recipe_internal(
    recipe_id: str, patch_data: RecipePatch, current_user: User, db: Session
) -> RecipeDetail:
    """
    Partially update recipe metadata.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    update_data = patch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recipe, field, value)

    db.commit()
    db.refresh(recipe)

    return get_recipe_internal(recipe_id, db)


def add_instruction_internal(
    recipe_id: str,
    instruction_data: InstructionCreate,
    current_user: User,
    db: Session,
) -> InstructionSchema:
    """
    Add a single instruction step to a recipe.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    existing_instructions = (
        db.query(Instruction)
        .filter(Instruction.recipe_id == recipe_id)
        .order_by(Instruction.step_number.asc())
        .all()
    )

    step_number = instruction_data.step_number
    if step_number is None:
        max_step = max([i.step_number for i in existing_instructions], default=0)
        step_number = max_step + 1
    else:
        # Shift existing steps with step_number >= new step_number
        for existing in existing_instructions:
            if existing.step_number >= step_number:
                existing.step_number += 1

    new_instruction = Instruction(
        title=instruction_data.title,
        description=instruction_data.description,
        step_number=step_number,
        timing=instruction_data.timing,
        recipe_id=recipe_id,
    )

    db.add(new_instruction)
    db.commit()
    db.refresh(new_instruction)

    return InstructionSchema.model_validate(new_instruction)


def patch_instruction_internal(
    recipe_id: str,
    step_or_id: str,
    instruction_data: InstructionPatch,
    current_user: User,
    db: Session,
) -> InstructionSchema:
    """
    Partially update a specific instruction step by instruction ID or step number.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    instruction = (
        db.query(Instruction)
        .filter(Instruction.recipe_id == recipe_id, Instruction.id == step_or_id)
        .first()
    )
    if not instruction and step_or_id.isdigit():
        instruction = (
            db.query(Instruction)
            .filter(
                Instruction.recipe_id == recipe_id,
                Instruction.step_number == int(step_or_id),
            )
            .first()
        )

    if not instruction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Instruction not found"
        )

    update_data = instruction_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(instruction, field, value)

    db.commit()
    db.refresh(instruction)

    return InstructionSchema.model_validate(instruction)


def delete_instruction_internal(
    recipe_id: str,
    step_or_id: str,
    current_user: User,
    db: Session,
) -> None:
    """
    Delete a specific instruction step and re-sequence remaining steps.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    instruction = (
        db.query(Instruction)
        .filter(Instruction.recipe_id == recipe_id, Instruction.id == step_or_id)
        .first()
    )
    if not instruction and step_or_id.isdigit():
        instruction = (
            db.query(Instruction)
            .filter(
                Instruction.recipe_id == recipe_id,
                Instruction.step_number == int(step_or_id),
            )
            .first()
        )

    if not instruction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Instruction not found"
        )

    deleted_id = instruction.id
    db.delete(instruction)
    db.flush()

    # Re-sequence remaining instructions
    remaining = (
        db.query(Instruction)
        .filter(Instruction.recipe_id == recipe_id, Instruction.id != deleted_id)
        .order_by(Instruction.step_number.asc())
        .all()
    )
    for idx, inst in enumerate(remaining, start=1):
        inst.step_number = idx

    db.commit()


def add_ingredient_internal(
    recipe_id: str,
    ingredient_data: IngredientCreate,
    current_user: User,
    db: Session,
) -> IngredientSchema:
    """
    Add a single ingredient to a recipe.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    existing_ingredients = (
        db.query(Ingredient)
        .filter(Ingredient.recipe_id == recipe_id)
        .order_by(Ingredient.order_index.asc())
        .all()
    )

    order_index = ingredient_data.order_index
    if order_index is None:
        max_order = max([i.order_index for i in existing_ingredients], default=-1)
        order_index = max_order + 1

    new_ingredient = Ingredient(
        name=ingredient_data.name,
        quantity=ingredient_data.quantity,
        unit=ingredient_data.unit,
        subtext=ingredient_data.subtext,
        order_index=order_index,
        recipe_id=recipe_id,
    )

    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)

    return IngredientSchema.model_validate(new_ingredient)


def patch_ingredient_internal(
    recipe_id: str,
    ingredient_id: str,
    ingredient_data: IngredientPatch,
    current_user: User,
    db: Session,
) -> IngredientSchema:
    """
    Partially update a specific ingredient.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    ingredient = (
        db.query(Ingredient)
        .filter(Ingredient.recipe_id == recipe_id, Ingredient.id == ingredient_id)
        .first()
    )
    if not ingredient and ingredient_id.isdigit():
        ingredient = (
            db.query(Ingredient)
            .filter(
                Ingredient.recipe_id == recipe_id,
                Ingredient.order_index == int(ingredient_id),
            )
            .first()
        )

    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )

    update_data = ingredient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ingredient, field, value)

    db.commit()
    db.refresh(ingredient)

    return IngredientSchema.model_validate(ingredient)


def delete_ingredient_internal(
    recipe_id: str,
    ingredient_id: str,
    current_user: User,
    db: Session,
) -> None:
    """
    Delete a specific ingredient from a recipe.
    """
    enforce_recipe_permissions(
        db,
        current_user,
        recipe_id,
        required_roles=[PermissionRole.OWNER, PermissionRole.EDITOR],
    )

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    ingredient = (
        db.query(Ingredient)
        .filter(Ingredient.recipe_id == recipe_id, Ingredient.id == ingredient_id)
        .first()
    )
    if not ingredient and ingredient_id.isdigit():
        ingredient = (
            db.query(Ingredient)
            .filter(
                Ingredient.recipe_id == recipe_id,
                Ingredient.order_index == int(ingredient_id),
            )
            .first()
        )

    if not ingredient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )

    deleted_id = ingredient.id
    db.delete(ingredient)
    db.flush()

    # Re-sequence remaining ingredients order_index
    remaining = (
        db.query(Ingredient)
        .filter(Ingredient.recipe_id == recipe_id, Ingredient.id != deleted_id)
        .order_by(Ingredient.order_index.asc())
        .all()
    )
    for idx, ing in enumerate(remaining):
        ing.order_index = idx

    db.commit()


def delete_recipe_internal(
    recipe_id: str,
    current_user: User,
    db: Session,
):
    enforce_recipe_permissions(db, current_user, recipe_id, [PermissionRole.OWNER])

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    # Delete the recipe (cascade will handle related records)
    db.delete(recipe)
    db.commit()


def get_recipe_internal(recipe_id: str, db: Session) -> RecipeDetail:
    """
    Get a recipe by ID with all ingredients and instructions.
    No permissions are checked.

    Args:
        recipe_id: Recipe ID
        db: Database session

    Returns:
        Detailed recipe information with ingredients and instructions

    Raises:
        HTTPException: If recipe not found
    """
    recipe = (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients), joinedload(Recipe.instructions))
        .filter(Recipe.id == recipe_id)
        .first()
    )

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    # Sort ingredients by order_index and instructions by step_number
    recipe.ingredients.sort(key=lambda x: x.order_index)
    recipe.instructions.sort(key=lambda x: x.step_number)

    return RecipeDetail.model_validate(recipe)


def list_recipes_internal(
    db: Session,
    title_search_query: Optional[str] = None,  # Fuzzy match of recipe title
    user_id_filter: Optional[str] = None,  # User ID to filter recipes for
    page: int = 1,
    limit: int = 10,
) -> RecipeList:
    query = db.query(Recipe)
    limit = min(limit, settings.max_recipes_per_page)

    if user_id_filter:
        query = query.join(RecipePermission, Recipe.id == RecipePermission.recipe_id)

    if title_search_query:
        query = query.filter(Recipe.title.ilike(f"%{title_search_query}%"))

    # Pagination Data
    total = query.count()
    offset = (page - 1) * limit
    recipes = query.order_by(Recipe.created_at.desc()).offset(offset).limit(limit).all()

    return RecipeList(
        items=[RecipeListItem.model_validate(recipe) for recipe in recipes],
        total=total,
        page=page,
        limit=limit,
        has_next=(page * limit) < total,
        has_prev=page > 1,
    )


def list_recipe_permissions_internal(recipe_id: str, user: Optional[User], db: Session):
    # Check if recipe exists
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found"
        )

    # Determine caller's role for this recipe (None if anonymous or no specific role)
    caller_permission = (
        get_user_recipe_permission(db, user.id, recipe_id) if user else None
    )
    is_privileged = (user and getattr(user, "is_admin", False)) or (
        caller_permission
        and caller_permission.role
        in [
            PermissionRole.OWNER,
            PermissionRole.EDITOR,
        ]
    )

    # Get permissions for this recipe with user details
    query = (
        db.query(RecipePermission)
        .join(User, RecipePermission.user_id == User.id)
        .filter(RecipePermission.recipe_id == recipe_id)
    )

    # If not privileged (owner/editor), only return the owner(s)
    if not is_privileged:
        query = query.filter(RecipePermission.role == PermissionRole.OWNER)

    permissions = query.all()

    # Build response with user details
    responses = []
    for permission in permissions:
        response = RecipePermissionDetail.model_validate(permission)
        response.user_username = permission.user.username
        # Only expose email to owners/editors
        if is_privileged:
            response.user_email = permission.user.email
        else:
            response.user_email = None

        responses.append(response.model_dump())

    return responses


def grant_recipe_permission_internal(
    recipe_id: str,
    target_username: str,
    target_role: PermissionRole,
    current_user: User,
    db: Session,
):
    enforce_recipe_permissions(db, current_user, recipe_id, [PermissionRole.OWNER])

    target_user: User = (
        db.query(User)
        .filter(func.lower(User.username) == func.lower(target_username))
        .first()
    )
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing_permission = get_user_recipe_permission(db, target_user.id, recipe_id)
    if existing_permission and existing_permission.role == target_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has permission for this recipe",
        )

    new_permission = RecipePermission(
        user_id=target_user.id, recipe_id=recipe_id, role=target_role
    )

    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)

    return RecipePermissionDetail.model_validate(new_permission)


def revoke_recipe_permission_internal(
    recipe_id: str, target_user_id: str, current_user: User, db: Session
):
    enforce_recipe_permissions(db, current_user, recipe_id, [PermissionRole.OWNER])

    if target_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can not revoke your own permissions.",
        )

    target_user: User = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    permission = get_user_recipe_permission(db, target_user.id, recipe_id)
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    # Delete the permission
    db.delete(permission)
    db.commit()
