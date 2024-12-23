from pydantic import BaseModel
from typing import List

from app.data.model.Ingredient import Ingredient
from app.data.model.InstructionStep import InstructionStep

class Recipe(BaseModel):
    id: str
    title: str
    description: str  # Recipe description. The description is stored in S3 and the URL is stored in the database.
    ingredients: List[Ingredient]
    instructions: List[InstructionStep]