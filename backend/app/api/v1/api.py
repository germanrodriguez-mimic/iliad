from fastapi import APIRouter

from app.api.v1.endpoints import tasks, subdatasets, raw_episodes, upload, items, embodiments, teleop_modes

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

# Upload endpoints
api_router.include_router(
    upload.router,
    prefix="/upload",
    tags=["upload"],
    responses={
        400: {"description": "Invalid input"},
        500: {"description": "Upload failed"}
    }
)

# Items endpoints
api_router.include_router(
    items.router,
    prefix="/items",
    tags=["items"],
    responses={
        404: {"description": "Item not found"},
        400: {"description": "Invalid input"}
    }
)

# Embodiments endpoints
api_router.include_router(
    embodiments.router,
    prefix="/embodiments",
    tags=["embodiments"],
    responses={
        404: {"description": "Embodiment not found"},
        400: {"description": "Invalid input"}
    }
)

# Teleop modes endpoints
api_router.include_router(
    teleop_modes.router,
    prefix="/teleop-modes",
    tags=["teleop-modes"],
    responses={
        404: {"description": "Teleop mode not found"},
        400: {"description": "Invalid input"}
    }
) 