from typing import Optional, List

from pydantic import BaseModel

class DeleteRecipeRequest(BaseModel):
    recipe_id: str

class DeleteRecipeResponse(BaseModel):
    success: bool