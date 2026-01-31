from pydantic import BaseModel
from typing import List

from src.data.model.Ingredient import Ingredient
from src.data.model.InstructionStep import InstructionStep


class Recipe(BaseModel):
    id: str
    title: str
    description: str  # Recipe description. The description is stored in S3 and the URL is stored in the database.
    tags: List[str] = []  # Tags for the recipe, e.g., "vegan", "gluten-free", etc.
    ingredients: List[Ingredient]
    instructions: List[InstructionStep]
    username: str  # Username of the user who created the recipe
