from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import task as crud
from app.schemas.task import (
    Task, TaskCreate, TaskUpdate,
    TaskVariant, TaskVariantCreate, TaskVariantUpdate,
    TaskList, TaskDetailSummary
)

router = APIRouter()

# Task endpoints
@router.get("/list", response_model=List[TaskList])
def read_tasks_list(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_external: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    tasks = crud.get_tasks(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        is_external=is_external
    )
    return tasks

@router.post("/", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task=task)

@router.get("/", response_model=List[Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_external: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    tasks = crud.get_tasks(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        is_external=is_external
    )
    return tasks

@router.get("/{task_id}", response_model=Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = crud.get_task(db=db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db)
):
    db_task = crud.update_task(db=db, task_id=task_id, task=task)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    success = crud.delete_task(db=db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# TaskVariant endpoints
@router.post("/{task_id}/variants/", response_model=TaskVariant)
def create_task_variant(
    task_id: int,
    variant: TaskVariantCreate,
    db: Session = Depends(get_db)
):
    # Verify task exists
    if not crud.get_task(db=db, task_id=task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.create_task_variant(db=db, task_id=task_id, variant=variant)

@router.get("/{task_id}/variants/", response_model=List[TaskVariant])
def read_task_variants(
    task_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Verify task exists
    if not crud.get_task(db=db, task_id=task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.get_task_variants(db=db, task_id=task_id, skip=skip, limit=limit)

@router.get("/variants/{variant_id}", response_model=TaskVariant)
def read_task_variant(variant_id: int, db: Session = Depends(get_db)):
    db_variant = crud.get_task_variant(db=db, variant_id=variant_id)
    if db_variant is None:
        raise HTTPException(status_code=404, detail="Task variant not found")
    return db_variant

@router.put("/variants/{variant_id}", response_model=TaskVariant)
def update_task_variant(
    variant_id: int,
    variant: TaskVariantUpdate,
    db: Session = Depends(get_db)
):
    db_variant = crud.update_task_variant(db=db, variant_id=variant_id, variant=variant)
    if db_variant is None:
        raise HTTPException(status_code=404, detail="Task variant not found")
    return db_variant

@router.delete("/variants/{variant_id}")
def delete_task_variant(variant_id: int, db: Session = Depends(get_db)):
    success = crud.delete_task_variant(db=db, variant_id=variant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task variant not found")
    return {"message": "Task variant deleted successfully"}

@router.get("/{task_id}/detail", response_model=TaskDetailSummary)
def read_task_detail(task_id: int, db: Session = Depends(get_db)):
    summary = crud.get_task_detail_summary(db=db, task_id=task_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return summary 