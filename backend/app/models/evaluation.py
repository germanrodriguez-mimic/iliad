from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base

class Evaluation(Base):
    __tablename__ = "evaluations"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("preproduction.tasks.id"))
    name = Column(String)
    description = Column(String)
    media = Column(String)
    items = Column(String)
    embodiment_id = Column(Integer, ForeignKey("preproduction.embodiments.id"))
    notes = Column(String) 