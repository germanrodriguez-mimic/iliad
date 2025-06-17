from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base

class TeleopMode(Base):
    __tablename__ = "teleop_modes"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)

    # Relationships
    subdatasets = relationship("Subdataset", back_populates="teleop_mode") 