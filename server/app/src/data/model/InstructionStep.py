from pydantic import BaseModel

class InstructionStep(BaseModel):
    id: str
    title: str
    description: str