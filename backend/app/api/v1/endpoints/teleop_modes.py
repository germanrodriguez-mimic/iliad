from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.teleop_mode import TeleopMode

router = APIRouter()

@router.get("/", response_model=List[dict])
def read_teleop_modes(db: Session = Depends(get_db)):
    """
    Retrieve all teleop modes.
    """
    teleop_modes = db.query(TeleopMode).all()
    return [
        {
            "id": teleop_mode.id,
            "name": teleop_mode.name,
            "description": teleop_mode.description
        }
        for teleop_mode in teleop_modes
    ]

@router.get("/{teleop_mode_id}", response_model=dict)
def read_teleop_mode(teleop_mode_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific teleop mode by ID.
    """
    teleop_mode = db.query(TeleopMode).filter(TeleopMode.id == teleop_mode_id).first()
    if not teleop_mode:
        raise HTTPException(status_code=404, detail="Teleop mode not found")
    
    return {
        "id": teleop_mode.id,
        "name": teleop_mode.name,
        "description": teleop_mode.description
    } 