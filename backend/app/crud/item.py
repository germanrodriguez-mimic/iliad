from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate

# Item CRUD operations
def create_item(db: Session, item: ItemCreate) -> Item:
    db_item = Item(
        name=item.name,
        url=item.url,
        images=item.images,
        notes=item.notes
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_item(db: Session, item_id: int) -> Optional[Item]:
    return db.query(Item).filter(Item.id == item_id).first()

def get_items(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[Item]:
    return db.query(Item).offset(skip).limit(limit).all()

def update_item(db: Session, item_id: int, item: ItemUpdate) -> Optional[Item]:
    db_item = get_item(db, item_id)
    if not db_item:
        return None
    
    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int) -> bool:
    db_item = get_item(db, item_id)
    if not db_item:
        return False
    
    db.delete(db_item)
    db.commit()
    return True 