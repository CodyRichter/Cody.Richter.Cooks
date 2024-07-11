from pydantic import BaseModel
from typing import List, Optional

class Ingredient(BaseModel):
    id: str
    name: str
    quantity: float
    unit: str
    subtext: Optional[str]

class InstructionStep(BaseModel):
    id: str
    step_number: int  # Step number in the recipe, starting from 0
    title: str
    description: str

class Recipe(BaseModel):
    id: str
    title: str
    description: str
    ingredients: List[Ingredient]
    instructions: List[InstructionStep]