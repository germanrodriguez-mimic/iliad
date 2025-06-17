from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_external = Column(Boolean)

    # Relationships
    variants = relationship("TaskVariant", back_populates="task", cascade="all, delete-orphan") 