from pydantic import BaseModel
from typing import Optional

class TrainingRunSummary(BaseModel):
    id: int
    dataset_id: Optional[int]
    url: Optional[str]

    class Config:
        from_attributes = True 