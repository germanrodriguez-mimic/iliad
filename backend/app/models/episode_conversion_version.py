from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.session import Base

class EpisodeConversionVersion(Base):
    __tablename__ = "episode_conversion_versions"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String)
    repository = Column(String)
    git_commit = Column(String)
    is_active = Column(Boolean)
    is_main = Column(Boolean)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True)) 