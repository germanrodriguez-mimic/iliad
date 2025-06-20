from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base

class TrainingRun(Base):
    __tablename__ = "training_runs"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("preproduction.datasets.id"))
    url = Column(String)

class TrainingRunsToTasks(Base):
    __tablename__ = "training_runs_to_tasks"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    training_run_id = Column(Integer, ForeignKey("preproduction.training_runs.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("preproduction.tasks.id", ondelete="CASCADE"), nullable=False) 