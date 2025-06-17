from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class RawEpisodeBase(BaseModel):
    operator: str
    url: str
    label: str
    repository: Optional[str] = None
    git_commit: Optional[str] = None
    recorded_at: Optional[datetime] = None

class RawEpisodeCreate(RawEpisodeBase):
    pass

class RawEpisodeUpdate(RawEpisodeBase):
    operator: Optional[str] = None
    url: Optional[str] = None
    label: Optional[str] = None

class RawEpisode(RawEpisodeBase):
    id: int
    subdataset_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class SubdatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    notes: Optional[str] = None
    embodiment_id: Optional[int] = None
    teleop_mode_id: Optional[int] = None

class SubdatasetCreate(SubdatasetBase):
    pass

class SubdatasetUpdate(SubdatasetBase):
    name: Optional[str] = None

class Subdataset(SubdatasetBase):
    id: int
    raw_episodes: List[RawEpisode] = []

    class Config:
        from_attributes = True 