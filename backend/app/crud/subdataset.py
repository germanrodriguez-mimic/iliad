from typing import List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, func, case

from app.models.subdataset import Subdataset
from app.models.raw_episode import RawEpisode
from app.models.embodiment import Embodiment
from app.models.teleop_mode import TeleopMode
from app.schemas.subdataset import (
    SubdatasetCreate, SubdatasetUpdate,
    RawEpisodeCreate, RawEpisodeUpdate,
    EpisodeStats
)
from app.models.tasks_to_subdatasets import TasksToSubdatasets
from app.models.task import Task
from app.models.task_variant import TaskVariant
from app.models.task_variants_to_subdatasets import TaskVariantsToSubdatasets
from app.core.performance_monitor import query_timer

# Subdataset CRUD operations
def create_subdataset(db: Session, subdataset: SubdatasetCreate) -> Subdataset:
    db_subdataset = Subdataset(
        name=subdataset.name,
        description=subdataset.description,
        notes=subdataset.notes,
        embodiment_id=subdataset.embodiment_id,
        teleop_mode_id=subdataset.teleop_mode_id
    )
    db.add(db_subdataset)
    db.commit()
    db.refresh(db_subdataset)
    return db_subdataset

def get_subdataset(db: Session, subdataset_id: int) -> Optional[Subdataset]:
    subdataset = db.query(Subdataset)\
        .options(
            joinedload(Subdataset.embodiment),
            joinedload(Subdataset.teleop_mode),
            joinedload(Subdataset.raw_episodes)
        )\
        .filter(Subdataset.id == subdataset_id)\
        .first()
    
    if subdataset:
        # Calculate episode stats
        stats = db.query(
            func.count(RawEpisode.id).label('total'),
            func.sum(case((RawEpisode.label == 'good', 1), else_=0)).label('good'),
            func.sum(case((RawEpisode.label == 'bad', 1), else_=0)).label('bad')
        ).filter(RawEpisode.subdataset_id == subdataset_id).first()
        
        subdataset.episode_stats = EpisodeStats(
            total=stats.total or 0,
            good=stats.good or 0,
            bad=stats.bad or 0
        )
    
    return subdataset

@query_timer
def get_subdatasets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    task_id: Optional[int] = None,
    variant_id: Optional[int] = None
) -> List[Subdataset]:
    query = db.query(Subdataset)

    # Unassigned logic: if -1, return subdatasets not linked to any variant
    if variant_id == -1 or task_id == -1:
        assigned_subdataset_ids = db.query(TaskVariantsToSubdatasets.subdataset_id).distinct()
        query = query.filter(~Subdataset.id.in_(assigned_subdataset_ids))
    elif variant_id is not None:
        # Filter subdatasets linked to the given variant using JOIN
        query = query.join(TaskVariantsToSubdatasets, Subdataset.id == TaskVariantsToSubdatasets.subdataset_id)\
            .filter(TaskVariantsToSubdatasets.task_variant_id == variant_id)
    elif task_id is not None:
        # Filter subdatasets linked to any variant of the given task using JOINs
        query = query.join(TaskVariantsToSubdatasets, Subdataset.id == TaskVariantsToSubdatasets.subdataset_id)\
            .join(TaskVariant, TaskVariantsToSubdatasets.task_variant_id == TaskVariant.id)\
            .filter(TaskVariant.task_id == task_id)

    return query\
        .options(
            joinedload(Subdataset.embodiment),
            joinedload(Subdataset.teleop_mode)
        )\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_subdataset(
    db: Session,
    subdataset_id: int,
    subdataset: SubdatasetUpdate
) -> Optional[Subdataset]:
    db_subdataset = get_subdataset(db, subdataset_id)
    if not db_subdataset:
        return None
    
    update_data = subdataset.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_subdataset, field, value)
    
    db.commit()
    db.refresh(db_subdataset)
    return db_subdataset

def delete_subdataset(db: Session, subdataset_id: int) -> bool:
    db_subdataset = get_subdataset(db, subdataset_id)
    if not db_subdataset:
        return False
    
    db.delete(db_subdataset)
    db.commit()
    return True

# RawEpisode CRUD operations
def create_raw_episode(
    db: Session,
    subdataset_id: int,
    raw_episode: RawEpisodeCreate
) -> RawEpisode:
    db_raw_episode = RawEpisode(
        subdataset_id=subdataset_id,
        operator=raw_episode.operator,
        url=raw_episode.url,
        label=raw_episode.label,
        repository=raw_episode.repository,
        git_commit=raw_episode.git_commit,
        recorded_at=raw_episode.recorded_at
    )
    db.add(db_raw_episode)
    db.commit()
    db.refresh(db_raw_episode)
    return db_raw_episode

def get_raw_episode(db: Session, raw_episode_id: int) -> Optional[RawEpisode]:
    return db.query(RawEpisode).filter(RawEpisode.id == raw_episode_id).first()

def get_raw_episodes(
    db: Session,
    subdataset_id: int,
    skip: int = 0,
    limit: int = 100,
    label: Optional[str] = None
) -> List[RawEpisode]:
    query = db.query(RawEpisode).filter(RawEpisode.subdataset_id == subdataset_id)
    
    if label is not None:
        query = query.filter(RawEpisode.label == label)
    
    return query.offset(skip).limit(limit).all()

def get_all_raw_episodes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    label: Optional[str] = None
) -> List[RawEpisode]:
    """
    Get all raw episodes with optional filtering.
    """
    query = db.query(RawEpisode)
    
    if label is not None:
        query = query.filter(RawEpisode.label == label)
    
    return query.offset(skip).limit(limit).all()

def update_raw_episode(
    db: Session,
    raw_episode_id: int,
    raw_episode: RawEpisodeUpdate
) -> Optional[RawEpisode]:
    db_raw_episode = get_raw_episode(db, raw_episode_id)
    if not db_raw_episode:
        return None
    
    update_data = raw_episode.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_raw_episode, field, value)
    
    db.commit()
    db.refresh(db_raw_episode)
    return db_raw_episode

def delete_raw_episode(db: Session, raw_episode_id: int) -> bool:
    db_raw_episode = get_raw_episode(db, raw_episode_id)
    if not db_raw_episode:
        return False
    
    db.delete(db_raw_episode)
    db.commit()
    return True

def get_tasks_and_variants_by_subdataset(db: Session, subdataset_id: int):
    # Get all tasks and their variants for this subdataset in optimized queries
    tasks = db.query(Task)\
        .join(TasksToSubdatasets, Task.id == TasksToSubdatasets.task_id)\
        .options(
            joinedload(Task.variants)
        )\
        .filter(TasksToSubdatasets.subdataset_id == subdataset_id)\
        .all()
    
    return tasks

def get_linked_task_and_variant_by_subdataset(db: Session, subdataset_id: int):
    # Get the task and variant linked to this subdataset in a single optimized query
    result = db.query(Task, TaskVariant)\
        .join(TaskVariant, Task.id == TaskVariant.task_id)\
        .join(TaskVariantsToSubdatasets, TaskVariant.id == TaskVariantsToSubdatasets.task_variant_id)\
        .filter(TaskVariantsToSubdatasets.subdataset_id == subdataset_id)\
        .first()
    
    if not result:
        return []
    
    task, variant = result
    task.variants = [variant]  # Attach only the linked variant
    return [task] 