from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY
from sqlalchemy.orm import relationship

from app.db.session import Base

class Subdataset(Base):
    __tablename__ = "subdatasets"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    notes = Column(String)
    embodiment_id = Column(Integer, ForeignKey("preproduction.embodiments.id", ondelete="SET NULL"))
    teleop_mode_id = Column(Integer, ForeignKey("preproduction.teleop_modes.id", ondelete="SET NULL"))

    # Relationships
    embodiment = relationship("Embodiment", back_populates="subdatasets")
    teleop_mode = relationship("TeleopMode", back_populates="subdatasets")
    raw_episodes = relationship("RawEpisode", back_populates="subdataset", cascade="all, delete-orphan") 