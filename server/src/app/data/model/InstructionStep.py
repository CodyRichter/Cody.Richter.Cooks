from pydantic import BaseModel

class InstructionStep(BaseModel):
    id: str
    step_number: int  # Step number in the recipe, starting from 0
    title: str
    description: str