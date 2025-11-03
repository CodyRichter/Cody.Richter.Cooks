from typing import List, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.ingredient import Ingredient
from app.models.instruction import Instruction
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.models.user import User
from app.schemas.recipe import (
    RecipeCreate, RecipeDetail
)
from app.utils.auth import get_current_active_user