from sqlalchemy import Column, Integer, String, ARRAY
from app.db.session import Base

class Item(Base):
    __tablename__ = "items"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    url = Column(String)
    images = Column(ARRAY(String))
    notes = Column(String) 