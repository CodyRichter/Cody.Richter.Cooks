from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class Ingredient(BaseModel):
    id: str
    name: str
    quantity: Decimal
    unit: str
    subtext: Optional[str]