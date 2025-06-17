from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.task import Task
from app.models.task_variant import TaskVariant
from app.schemas.task import TaskCreate, TaskUpdate, TaskVariantCreate, TaskVariantUpdate

# Task CRUD operations
def create_task(db: Session, task: TaskCreate) -> Task:
    db_task = Task(
        name=task.name,
        description=task.description,
        status=task.status,
        is_external=task.is_external
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()

def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_external: Optional[bool] = None
) -> List[Task]:
    query = db.query(Task)
    
    if status is not None:
        query = query.filter(Task.status == status)
    if is_external is not None:
        query = query.filter(Task.is_external == is_external)
    
    return query.offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task: TaskUpdate) -> Optional[Task]:
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    update_data = task.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True

# TaskVariant CRUD operations
def create_task_variant(db: Session, task_id: int, variant: TaskVariantCreate) -> TaskVariant:
    db_variant = TaskVariant(
        task_id=task_id,
        name=variant.name,
        description=variant.description,
        items=variant.items,
        embodiment_id=variant.embodiment_id,
        teleop_mode_id=variant.teleop_mode_id,
        notes=variant.notes,
        media=variant.media
    )
    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)
    return db_variant

def get_task_variant(db: Session, variant_id: int) -> Optional[TaskVariant]:
    return db.query(TaskVariant).filter(TaskVariant.id == variant_id).first()

def get_task_variants(
    db: Session,
    task_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[TaskVariant]:
    return db.query(TaskVariant)\
        .filter(TaskVariant.task_id == task_id)\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_task_variant(
    db: Session,
    variant_id: int,
    variant: TaskVariantUpdate
) -> Optional[TaskVariant]:
    db_variant = get_task_variant(db, variant_id)
    if not db_variant:
        return None
    
    update_data = variant.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_variant, field, value)
    
    db.commit()
    db.refresh(db_variant)
    return db_variant

def delete_task_variant(db: Session, variant_id: int) -> bool:
    db_variant = get_task_variant(db, variant_id)
    if not db_variant:
        return False
    
    db.delete(db_variant)
    db.commit()
    return True 