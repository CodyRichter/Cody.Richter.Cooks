from typing import Optional, List

from pydantic import BaseModel

class RecipeEntry(BaseModel):
    id: str
    title: str

class ListRecipeRequest(BaseModel):
    pagination_key: Optional[str] = None

class ListRecipeResponse(BaseModel):
    recipes: List[RecipeEntry]
    pagination_key: Optional[str] = None