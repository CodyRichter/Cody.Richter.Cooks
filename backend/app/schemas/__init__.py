"""
Pydantic schemas package for API serialization.
"""

# Import consolidated schemas
from app.schemas.user import (
    UserSchema,
    UserCreateSchema,
    UserResponseSchema,
    UserLogin,
)
from app.schemas.auth import (
    AuthTokenResponse,
    AuthTokenRefreshRequest,
    AuthTokenRefreshResponse,
)
from app.schemas.recipe import (
    RecipeCreate,
    RecipeDetail,
    RecipeListItem,
    RecipeSearchParams,
    RecipeList,
)
from app.schemas.recipe_permission import (
    PermissionRole,
    RecipePermissionDetail,
    GrantPermissionRequest,
    RevokePermissionRequest,
)
from app.schemas.ingredient import (
    IngredientSchema,
    IngredientCreate,
    IngredientUpdate,
    IngredientResponse,
    IngredientListCreate,
    IngredientListResponse,
)
from app.schemas.instruction import (
    InstructionSchema,
    InstructionCreate,
    InstructionUpdate,
    InstructionResponse,
    InstructionListCreate,
    InstructionListResponse,
)

__all__ = [
    # User schemas
    "UserSchema",
    "UserCreateSchema",
    "UserResponseSchema",
    "UserLogin",
    "AuthTokenResponse",
    "AuthTokenRefreshRequest",
    "AuthTokenRefreshResponse",
    # Recipe schemas
    "RecipeDetail",
    "RecipeCreate",
    "RecipeCreate",
    "RecipeDetail",
    "RecipeDetail",
    "RecipeDetail",
    "RecipeListItem",
    "RecipeSearchParams",
    "RecipeList",
    # Recipe permission schemas
    "PermissionRole",
    "RecipePermissionDetail",
    "GrantPermissionRequest",
    "RevokePermissionRequest",
    # Ingredient schemas
    "IngredientSchema",
    "IngredientCreate",
    "IngredientUpdate",
    "IngredientResponse",
    "IngredientListCreate",
    "IngredientListResponse",
    # Instruction schemas
    "InstructionSchema",
    "InstructionCreate",
    "InstructionUpdate",
    "InstructionResponse",
    "InstructionListCreate",
    "InstructionListResponse",
]
