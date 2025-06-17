import sys
import json
from pathlib import Path
from datetime import datetime

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.task import Task
from app.models.task_variant import TaskVariant

def datetime_handler(x):
    if isinstance(x, datetime):
        return x.isoformat()
    raise TypeError(f"Object of type {type(x)} is not JSON serializable")

def list_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(Task).all()
        
        if not tasks:
            print(json.dumps({"tasks": []}))
            return

        tasks_data = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "status": task.status,
                "created_at": task.created_at,
                "is_external": task.is_external,
                "variants": [
                    {
                        "id": variant.id,
                        "name": variant.name,
                        "description": variant.description,
                        "items": variant.items,
                        "notes": variant.notes,
                        "media": variant.media
                    }
                    for variant in task.variants
                ]
            }
            tasks_data.append(task_dict)

        print(json.dumps({"tasks": tasks_data}, default=datetime_handler, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        db.close()

if __name__ == "__main__":
    list_tasks() 