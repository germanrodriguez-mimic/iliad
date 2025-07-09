from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.embodiment import Embodiment

router = APIRouter()

@router.get("/", response_model=List[dict])
def read_embodiments(db: Session = Depends(get_db)):
    """
    Retrieve all embodiments.
    """
    embodiments = db.query(Embodiment).all()
    return [
        {
            "id": embodiment.id,
            "name": embodiment.name,
            "description": embodiment.description
        }
        for embodiment in embodiments
    ]

@router.get("/{embodiment_id}", response_model=dict)
def read_embodiment(embodiment_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific embodiment by ID.
    """
    embodiment = db.query(Embodiment).filter(Embodiment.id == embodiment_id).first()
    if not embodiment:
        raise HTTPException(status_code=404, detail="Embodiment not found")
    
    return {
        "id": embodiment.id,
        "name": embodiment.name,
        "description": embodiment.description
    } 