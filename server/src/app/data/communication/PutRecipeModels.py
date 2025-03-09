from pydantic import BaseModel

from app.data.model.Recipe import Recipe


class PutRecipeResponse(BaseModel):
    recipe: Recipe