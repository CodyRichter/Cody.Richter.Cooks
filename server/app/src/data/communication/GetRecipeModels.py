from typing import Optional

from pydantic import BaseModel

from src.data.model.Recipe import Recipe

class GetRecipeRequest(BaseModel):
    recipe_id: str

class GetRecipeResponse(BaseModel):
    recipe: Optional[Recipe]