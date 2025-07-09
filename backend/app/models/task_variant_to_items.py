from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

class TaskVariantToItems(Base):
    __tablename__ = "task_variant_to_items"
    __table_args__ = {"schema": "preproduction"}

    task_variant_id = Column(Integer, ForeignKey("preproduction.task_variants.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("preproduction.items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    
    # Relationships
    task_variant = relationship("TaskVariant", back_populates="item_links")
    item = relationship("Item")
    
    __table_args__ = (
        PrimaryKeyConstraint('task_variant_id', 'item_id'),
        {"schema": "preproduction"}
    ) 