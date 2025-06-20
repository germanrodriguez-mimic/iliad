from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EpisodeBase(BaseModel):
    url: Optional[str] = None
    subdataset_id: Optional[int] = None
    raw_episode_id: Optional[int] = None
    conversion_version_id: Optional[int] = None

class Episode(EpisodeBase):
    id: int
    uploaded_at: Optional[datetime]

    class Config:
        from_attributes = True 