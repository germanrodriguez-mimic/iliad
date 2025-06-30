from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EpisodeBase(BaseModel):
    url: Optional[str] = None
    subdataset_id: Optional[int] = None
    raw_episode_id: Optional[int] = None
    conversion_version_id: Optional[int] = None

class ConversionVersion(BaseModel):
    id: int
    version: str

class Episode(EpisodeBase):
    id: int
    uploaded_at: Optional[datetime]
    conversion_version: Optional[ConversionVersion]

    class Config:
        from_attributes = True 