from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY
from sqlalchemy.orm import relationship

from app.db.session import Base

class TaskVariant(Base):
    __tablename__ = "task_variants"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("preproduction.tasks.id", ondelete="CASCADE"))
    name = Column(String)
    description = Column(String)
    items = Column(String)
    embodiment_id = Column(Integer, nullable=True)
    teleop_mode_id = Column(Integer, nullable=True)
    notes = Column(String)
    media = Column(ARRAY(String))

    # Relationships
    task = relationship("Task", back_populates="variants") 