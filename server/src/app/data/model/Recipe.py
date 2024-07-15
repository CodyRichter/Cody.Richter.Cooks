from pydantic import BaseModel
from typing import List

from app.data.model.Ingredient import Ingredient
from app.data.model.InstructionStep import InstructionStep

class Recipe(BaseModel):
    id: str
    title: str
    description: str
    ingredients: List[Ingredient]
    instructions: List[InstructionStep]