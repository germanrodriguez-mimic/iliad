from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from app.models.episode import Episode

# CRUD for processed episodes
def get_episodes_by_subdataset(db: Session, subdataset_id: int, skip: int = 0, limit: int = 100) -> List[Episode]:
    return (
        db.query(Episode)
        .filter(Episode.subdataset_id == subdataset_id)
        .options(selectinload(Episode.conversion_version))
        .offset(skip)
        .limit(limit)
        .all()
    ) 