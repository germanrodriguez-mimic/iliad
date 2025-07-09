from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import item as crud
from app.schemas.item import Item, ItemCreate, ItemUpdate

router = APIRouter()

# Item endpoints
@router.get("/list", response_model=List[Item])
def read_items_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    items = crud.get_items(db=db, skip=skip, limit=limit)
    return items

@router.get("/", response_model=List[Item])
def read_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    items = crud.get_items(db=db, skip=skip, limit=limit)
    return items

@router.post("/", response_model=Item)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db=db, item=item)

@router.get("/{item_id}", response_model=Item)
def read_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_item(db=db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{item_id}", response_model=Item)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db)
):
    db_item = crud.update_item(db=db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"} 