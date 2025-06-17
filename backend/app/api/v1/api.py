from fastapi import APIRouter

from app.api.v1.endpoints import tasks, subdatasets, raw_episodes

api_router = APIRouter()

# Tasks endpoints
api_router.include_router(
    tasks.router,
    prefix="/tasks",
    tags=["tasks"],
    responses={
        404: {"description": "Task not found"},
        400: {"description": "Invalid input"}
    }
)

# Subdatasets endpoints
api_router.include_router(
    subdatasets.router,
    prefix="/subdatasets",
    tags=["subdatasets"],
    responses={
        404: {"description": "Subdataset not found"},
        400: {"description": "Invalid input"}
    }
)

# Raw Episodes endpoints
api_router.include_router(
    raw_episodes.router,
    prefix="/raw-episodes",
    tags=["raw-episodes"],
    responses={
        404: {"description": "Raw episode not found"},
        400: {"description": "Invalid input"},
        501: {"description": "Not implemented"}
    }
) 