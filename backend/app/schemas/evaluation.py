from pydantic import BaseModel
from typing import Optional

class EvaluationSummary(BaseModel):
    id: int
    task_id: int
    name: Optional[str]
    description: Optional[str]
    media: Optional[str]
    items: Optional[str]
    embodiment_id: Optional[int]
    notes: Optional[str]

    class Config:
        from_attributes = True 