from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base

class Episode(Base):
    __tablename__ = "episodes"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    subdataset_id = Column(Integer, ForeignKey("preproduction.subdatasets.id", ondelete="CASCADE"))
    raw_episode_id = Column(Integer, ForeignKey("preproduction.raw_episodes.id", ondelete="CASCADE"))
    conversion_version_id = Column(Integer, ForeignKey("preproduction.episode_conversion_versions.id", ondelete="CASCADE"))
    url = Column(String)
    uploaded_at = Column(DateTime(timezone=True))

    # Relationships
    # (Add relationships if needed, e.g., to Subdataset, RawEpisode, ConversionVersion) 