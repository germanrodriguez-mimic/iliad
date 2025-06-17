from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import subdataset as crud
from app.schemas.subdataset import (
    Subdataset, SubdatasetCreate, SubdatasetUpdate,
    RawEpisode, RawEpisodeCreate, RawEpisodeUpdate
)

router = APIRouter()

# Subdataset endpoints
@router.post("/", response_model=Subdataset)
def create_subdataset(
    *,
    db: Session = Depends(get_db),
    subdataset_in: SubdatasetCreate
) -> Subdataset:
    """
    Create new subdataset.
    """
    subdataset = crud.create_subdataset(db=db, subdataset=subdataset_in)
    return subdataset

@router.get("/", response_model=List[Subdataset])
def read_subdatasets(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    embodiment_id: Optional[int] = None,
    teleop_mode_id: Optional[int] = None
) -> List[Subdataset]:
    """
    Retrieve subdatasets.
    """
    subdatasets = crud.get_subdatasets(
        db=db,
        skip=skip,
        limit=limit,
        embodiment_id=embodiment_id,
        teleop_mode_id=teleop_mode_id
    )
    return subdatasets

@router.get("/{subdataset_id}", response_model=Subdataset)
def read_subdataset(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int
) -> Subdataset:
    """
    Get subdataset by ID.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    return subdataset

@router.put("/{subdataset_id}", response_model=Subdataset)
def update_subdataset(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    subdataset_in: SubdatasetUpdate
) -> Subdataset:
    """
    Update subdataset.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    subdataset = crud.update_subdataset(
        db=db,
        subdataset_id=subdataset_id,
        subdataset=subdataset_in
    )
    return subdataset

@router.delete("/{subdataset_id}", response_model=bool)
def delete_subdataset(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int
) -> bool:
    """
    Delete subdataset.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    return crud.delete_subdataset(db=db, subdataset_id=subdataset_id)

# RawEpisode endpoints
@router.post("/{subdataset_id}/episodes/", response_model=RawEpisode)
def create_raw_episode(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    raw_episode_in: RawEpisodeCreate
) -> RawEpisode:
    """
    Create new raw episode.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    raw_episode = crud.create_raw_episode(
        db=db,
        subdataset_id=subdataset_id,
        raw_episode=raw_episode_in
    )
    return raw_episode

@router.get("/{subdataset_id}/episodes/", response_model=List[RawEpisode])
def read_raw_episodes(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    skip: int = 0,
    limit: int = 100,
    label: Optional[str] = None
) -> List[RawEpisode]:
    """
    Retrieve raw episodes.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    raw_episodes = crud.get_raw_episodes(
        db=db,
        subdataset_id=subdataset_id,
        skip=skip,
        limit=limit,
        label=label
    )
    return raw_episodes

@router.get("/{subdataset_id}/episodes/{episode_id}", response_model=RawEpisode)
def read_raw_episode(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    episode_id: int
) -> RawEpisode:
    """
    Get raw episode by ID.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode or raw_episode.subdataset_id != subdataset_id:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    return raw_episode

@router.put("/{subdataset_id}/episodes/{episode_id}", response_model=RawEpisode)
def update_raw_episode(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    episode_id: int,
    raw_episode_in: RawEpisodeUpdate
) -> RawEpisode:
    """
    Update raw episode.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode or raw_episode.subdataset_id != subdataset_id:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    raw_episode = crud.update_raw_episode(
        db=db,
        raw_episode_id=episode_id,
        raw_episode=raw_episode_in
    )
    return raw_episode

@router.delete("/{subdataset_id}/episodes/{episode_id}", response_model=bool)
def delete_raw_episode(
    *,
    db: Session = Depends(get_db),
    subdataset_id: int,
    episode_id: int
) -> bool:
    """
    Delete raw episode.
    """
    subdataset = crud.get_subdataset(db=db, subdataset_id=subdataset_id)
    if not subdataset:
        raise HTTPException(status_code=404, detail="Subdataset not found")
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode or raw_episode.subdataset_id != subdataset_id:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    return crud.delete_raw_episode(db=db, raw_episode_id=episode_id) 