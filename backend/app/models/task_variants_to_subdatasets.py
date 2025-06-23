from sqlalchemy import Column, Integer, ForeignKey
from app.db.session import Base

class TaskVariantsToSubdatasets(Base):
    __tablename__ = "task_variants_to_subdatasets"
    __table_args__ = {"schema": "preproduction"}

    id = Column(Integer, primary_key=True, index=True)
    task_variant_id = Column(Integer, ForeignKey("preproduction.task_variants.id", ondelete="CASCADE"), nullable=False)
    subdataset_id = Column(Integer, ForeignKey("preproduction.subdatasets.id", ondelete="CASCADE"), nullable=False) 