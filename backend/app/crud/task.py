from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.task import Task
from app.models.task_variant import TaskVariant
from app.models.task_variant_to_items import TaskVariantToItems
from app.models.item import Item
from app.schemas.task import TaskCreate, TaskUpdate, TaskVariantCreate, TaskVariantUpdate, TaskDetailSummary, TaskVariantSubdatasets
from app.schemas.item import TaskVariantItemInfo
from app.models.tasks_to_subdatasets import TasksToSubdatasets
from app.models.subdataset import Subdataset
from app.models.training_run import TrainingRun, TrainingRunsToTasks
from app.models.evaluation import Evaluation
from app.schemas.subdataset import SubdatasetList, EmbodimentInfo, TeleopModeInfo
from app.schemas.training_run import TrainingRunSummary
from app.schemas.evaluation import EvaluationSummary
from app.models.task_variants_to_subdatasets import TaskVariantsToSubdatasets

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

def get_task_detail_summary(db: Session, task_id: int) -> TaskDetailSummary:
    # Get the task
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None

    # Get variants with joined embodiment and teleop mode
    variants = db.query(TaskVariant)\
        .options(
            joinedload(TaskVariant.embodiment),
            joinedload(TaskVariant.teleop_mode)
        )\
        .filter(TaskVariant.task_id == task_id)\
        .all()

    # For each variant, get linked subdatasets via task_variants_to_subdatasets
    def orm_to_dict(obj):
        return {k: v for k, v in obj.__dict__.items() if not k.startswith('_sa_')}

    def variant_to_summary(variant):
        # Get items for this variant
        item_links = db.query(TaskVariantToItems).filter(TaskVariantToItems.task_variant_id == variant.id).all()
        items = []
        for link in item_links:
            item = db.query(Item).filter(Item.id == link.item_id).first()
            if item:
                items.append(TaskVariantItemInfo(
                    item_id=item.id,
                    item_name=item.name,
                    quantity=link.quantity,
                    url=item.url,
                    images=item.images,
                    notes=item.notes
                ))
        
        return {
            **variant.__dict__,
            "embodiment": EmbodimentInfo.model_validate(orm_to_dict(variant.embodiment)) if variant.embodiment else None,
            "teleop_mode": TeleopModeInfo.model_validate(orm_to_dict(variant.teleop_mode)) if variant.teleop_mode else None,
            "items": items
        }

    subdatasets_by_variant = []
    for variant in variants:
        links = db.query(TaskVariantsToSubdatasets).filter(TaskVariantsToSubdatasets.task_variant_id == variant.id).all()
        subdataset_ids = [link.subdataset_id for link in links]
        subdatasets = db.query(Subdataset).filter(Subdataset.id.in_(subdataset_ids)).all() if subdataset_ids else []
        # Use variant_to_summary to ensure correct Pydantic types
        variant_summary = variant_to_summary(variant)
        subdatasets_by_variant.append(TaskVariantSubdatasets(
            variant=variant_summary,
            subdatasets=[SubdatasetList.model_validate({
                **sd.__dict__,
                "embodiment": EmbodimentInfo.model_validate({"id": sd.embodiment.id, "name": sd.embodiment.name}) if sd.embodiment else None,
                "teleop_mode": TeleopModeInfo.model_validate({"id": sd.teleop_mode.id, "name": sd.teleop_mode.name}) if sd.teleop_mode else None,
            }) for sd in subdatasets]
        ))

    # Optionally, flatten all subdatasets for backward compatibility
    all_subdatasets = [sd for group in subdatasets_by_variant for sd in group.subdatasets]

    # Get training runs via junction table
    tr_links = db.query(TrainingRunsToTasks).filter(TrainingRunsToTasks.task_id == task_id).all()
    tr_ids = [link.training_run_id for link in tr_links]
    training_runs = db.query(TrainingRun).filter(TrainingRun.id.in_(tr_ids)).all() if tr_ids else []

    # Get evaluations
    evaluations = db.query(Evaluation).filter(Evaluation.task_id == task_id).all()

    return TaskDetailSummary(
        id=task.id,
        name=task.name,
        description=task.description,
        status=task.status,
        created_at=task.created_at,
        is_external=task.is_external,
        variants=[variant_to_summary(v) for v in variants],
        subdatasets=all_subdatasets,
        subdatasets_by_variant=subdatasets_by_variant,
        training_runs=[TrainingRunSummary.model_validate(tr) for tr in training_runs],
        evaluations=[EvaluationSummary.model_validate(ev) for ev in evaluations],
    )

# Task Variant Items CRUD operations
def add_item_to_variant(db: Session, variant_id: int, item_id: int, quantity: int = 1) -> bool:
    # Verify variant and item exist
    variant = get_task_variant(db, variant_id)
    item = db.query(Item).filter(Item.id == item_id).first()
    if not variant or not item:
        return False
    
    # Check if relationship already exists
    existing = db.query(TaskVariantToItems).filter(
        TaskVariantToItems.task_variant_id == variant_id,
        TaskVariantToItems.item_id == item_id
    ).first()
    
    if existing:
        # Update quantity
        existing.quantity = quantity
    else:
        # Create new relationship
        db_item_link = TaskVariantToItems(
            task_variant_id=variant_id,
            item_id=item_id,
            quantity=quantity
        )
        db.add(db_item_link)
    
    db.commit()
    return True

def remove_item_from_variant(db: Session, variant_id: int, item_id: int) -> bool:
    # Verify variant exists
    variant = get_task_variant(db, variant_id)
    if not variant:
        return False
    
    # Find and delete the relationship
    item_link = db.query(TaskVariantToItems).filter(
        TaskVariantToItems.task_variant_id == variant_id,
        TaskVariantToItems.item_id == item_id
    ).first()
    
    if not item_link:
        return False
    
    db.delete(item_link)
    db.commit()
    return True

def get_variant_items(db: Session, variant_id: int) -> Optional[List[TaskVariantItemInfo]]:
    # Verify variant exists
    variant = get_task_variant(db, variant_id)
    if not variant:
        return None
    
    # Get items for this variant
    item_links = db.query(TaskVariantToItems).filter(TaskVariantToItems.task_variant_id == variant_id).all()
    items = []
    for link in item_links:
        item = db.query(Item).filter(Item.id == link.item_id).first()
        if item:
            items.append(TaskVariantItemInfo(
                item_id=item.id,
                item_name=item.name,
                quantity=link.quantity,
                url=item.url,
                images=item.images,
                notes=item.notes
            ))
    
    return items 