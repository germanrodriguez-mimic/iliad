from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class EmbodimentInfo(BaseModel):
    id: int
    name: str

class TeleopModeInfo(BaseModel):
    id: int
    name: str

class RawEpisodeBase(BaseModel):
    operator: Optional[str] = None
    url: Optional[str] = None
    label: Optional[str] = None
    repository: Optional[str] = None
    git_commit: Optional[str] = None
    recorded_at: Optional[datetime] = None

class RawEpisodeCreate(RawEpisodeBase):
    pass

class RawEpisodeUpdate(RawEpisodeBase):
    pass

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

class SubdatasetList(SubdatasetBase):
    id: int
    embodiment: Optional[EmbodimentInfo] = None
    teleop_mode: Optional[TeleopModeInfo] = None

    class Config:
        from_attributes = True

class Subdataset(SubdatasetBase):
    id: int
    embodiment: Optional[EmbodimentInfo] = None
    teleop_mode: Optional[TeleopModeInfo] = None
    raw_episodes: List["RawEpisode"] = []
    episode_stats: Optional["EpisodeStats"] = None

    class Config:
        from_attributes = True

class EpisodeStats(BaseModel):
    total: int
    good: int
    bad: int

# Update forward references
Subdataset.model_rebuild() 