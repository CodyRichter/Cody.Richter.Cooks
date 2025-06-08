from typing import Optional, List

from pydantic import BaseModel

class DeleteRecipeRequest(BaseModel):
    recipe_id: str
    username: str  # Username of the user who is deleting the recipe

class DeleteRecipeResponse(BaseModel):
    success: bool
    message: Optional[str] = None  # Optional message for success or error