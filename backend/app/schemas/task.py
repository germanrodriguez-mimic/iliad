from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TaskVariantBase(BaseModel):
    name: str
    description: Optional[str] = None
    items: Optional[str] = None
    embodiment_id: Optional[int] = None
    teleop_mode_id: Optional[int] = None
    notes: Optional[str] = None
    media: Optional[List[str]] = None

class TaskVariantCreate(TaskVariantBase):
    pass

class TaskVariantUpdate(TaskVariantBase):
    name: Optional[str] = None

class TaskVariant(TaskVariantBase):
    id: int
    task_id: int

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "created"
    is_external: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    name: Optional[str] = None
    status: Optional[str] = None
    is_external: Optional[bool] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    variants: List[TaskVariant] = []

    class Config:
        from_attributes = True

class TaskList(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True 