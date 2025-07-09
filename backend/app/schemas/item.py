from typing import Optional, List
from pydantic import BaseModel

class ItemBase(BaseModel):
    name: str
    url: Optional[str] = None
    images: Optional[List[str]] = None
    notes: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    name: Optional[str] = None

class Item(ItemBase):
    id: int

    class Config:
        from_attributes = True

class TaskVariantItemInfo(BaseModel):
    item_id: int
    item_name: str
    quantity: int
    url: Optional[str] = None
    images: Optional[List[str]] = None
    notes: Optional[str] = None 