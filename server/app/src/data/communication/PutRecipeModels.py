from pydantic import BaseModel

from src.data.model.Recipe import Recipe


class PutRecipeResponse(BaseModel):
    recipe: Recipe