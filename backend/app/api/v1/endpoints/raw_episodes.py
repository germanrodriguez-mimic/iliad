from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.crud import subdataset as crud
from app.schemas.subdataset import RawEpisode, RawEpisodeCreate, RawEpisodeUpdate

router = APIRouter()

@router.post("/", response_model=RawEpisode)
def create_raw_episode(
    *,
    db: Session = Depends(get_db),
    raw_episode_in: RawEpisodeCreate,
    subdataset_id: int
) -> RawEpisode:
    """
    Create a new raw episode.
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

@router.get("/", response_model=List[RawEpisode])
def read_raw_episodes(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    subdataset_id: Optional[int] = None,
    label: Optional[str] = None
) -> List[RawEpisode]:
    """
    Retrieve raw episodes with optional filtering.
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **subdataset_id**: Optional filter by subdataset ID
    - **label**: Optional filter by episode label
    """
    if subdataset_id is not None:
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
    else:
        raw_episodes = crud.get_all_raw_episodes(
            db=db,
            skip=skip,
            limit=limit,
            label=label
        )
    return raw_episodes

@router.get("/{episode_id}", response_model=RawEpisode)
def read_raw_episode(
    *,
    db: Session = Depends(get_db),
    episode_id: int
) -> RawEpisode:
    """
    Get a specific raw episode by ID.
    """
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    return raw_episode

@router.put("/{episode_id}", response_model=RawEpisode)
def update_raw_episode(
    *,
    db: Session = Depends(get_db),
    episode_id: int,
    raw_episode_in: RawEpisodeUpdate
) -> RawEpisode:
    """
    Update a raw episode.
    """
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    raw_episode = crud.update_raw_episode(
        db=db,
        raw_episode_id=episode_id,
        raw_episode=raw_episode_in
    )
    return raw_episode

@router.delete("/{episode_id}", response_model=bool)
def delete_raw_episode(
    *,
    db: Session = Depends(get_db),
    episode_id: int
) -> bool:
    """
    Delete a raw episode.
    """
    raw_episode = crud.get_raw_episode(db=db, raw_episode_id=episode_id)
    if not raw_episode:
        raise HTTPException(status_code=404, detail="Raw episode not found")
    return crud.delete_raw_episode(db=db, raw_episode_id=episode_id) 