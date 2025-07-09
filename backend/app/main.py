from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import atexit

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import cleanup_connector
from app.core.performance_monitor import get_performance_stats, log_performance_stats

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize application startup."""
    print("🚀 Starting mimic hub API")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    print("🛑 Shutting down mimic hub API")
    cleanup_connector()

# Register cleanup function for graceful shutdown
atexit.register(cleanup_connector)

@app.get("/")
async def root():
    return {"message": "Welcome to mimic hub API"}

@app.get("/health")
async def health_check():
    """Enhanced health check with performance metrics."""
    performance_stats = get_performance_stats()
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "Cloud SQL Connector",
        "performance": {
            "connections": {
                "total": performance_stats["connections"]["count"],
                "average_time_ms": round(performance_stats["connections"]["avg_time"] * 1000, 2)
            },
            "queries": {
                "total": performance_stats["queries"]["count"],
                "average_time_ms": round(performance_stats["queries"]["avg_time"] * 1000, 2)
            }
        }
    }

@app.get("/performance")
async def performance_metrics():
    """Detailed performance metrics endpoint."""
    stats = get_performance_stats()
    return {
        "database_performance": stats,
        "connection_method": "Cloud SQL Python Connector",
        "pool_settings": {
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.DB_POOL_TIMEOUT,
            "pool_recycle": settings.DB_POOL_RECYCLE
        }
    } 