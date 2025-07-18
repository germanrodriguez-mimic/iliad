from app.core.auth import User, create_access_token, get_current_user, oauth, AuthRequest
from fastapi import FastAPI, Request, Response, status, HTTPException, Depends
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

@app.post("/auth/google")
async def auth_google(auth_req: AuthRequest, request: Request, response: Response):
    try:
        # Use the code to fetch token from Google
        token = await oauth.google.authorize_access_token(request, code=auth_req.code, redirect_uri="postmessage")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not fetch token: {e}")

    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No user info in token")

    # ---> THE IMPORTANT PART: Verify the domain <---
    if user_info.get('hd') != settings.GOOGLE_AUTH_ALLOWED_DOMAINS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Use your @my-company.com account.")

    user = User(email=user_info.get('email'), name=user_info.get('name'))

    # Create our own JWT and set it in a secure cookie
    access_token = create_access_token(data={"sub": user.email, "name": user.name})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True, # Prevents JS access
        samesite="lax", # Can be 'strict'
        secure=False, # Set to True in production (HTTPS)
    )
    return {"user": user}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}