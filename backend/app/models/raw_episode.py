from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class RawEpisode(Base):
    __tablename__ = "raw_episodes"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    subdataset_id = Column(Integer, ForeignKey("preproduction.subdatasets.id", ondelete="CASCADE"))
    operator = Column(String)
    url = Column(String)
    label = Column(String)
    repository = Column(String)
    git_commit = Column(String)
    recorded_at = Column(DateTime(timezone=True))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    subdataset = relationship("Subdataset", back_populates="raw_episodes") 