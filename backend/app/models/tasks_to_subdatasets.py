from sqlalchemy import Column, Integer, ForeignKey
from app.db.session import Base

class TasksToSubdatasets(Base):
    __tablename__ = "tasks_to_subdatasets"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("preproduction.tasks.id", ondelete="CASCADE"), nullable=False)
    subdataset_id = Column(Integer, ForeignKey("preproduction.subdatasets.id", ondelete="CASCADE"), nullable=False) 