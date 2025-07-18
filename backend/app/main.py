from urllib.parse import urlparse
from app.core.auth import User, create_access_token, get_current_user, oauth, AuthRequest
from fastapi import FastAPI, Request, Response, status, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
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
    allow_origins=["http://localhost:5173"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.GOOGLE_AUTH_SECRET_KEY
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

@app.get("/auth/login/google")
async def login_google(request: Request):
    """
    Generate the Google authorization URL using the request's origin
    as the redirect URI, after validating it against a whitelist.
    """
    allowed_origins = [origin.strip() for origin in settings.GOOGLE_AUTH_ALLOWED_ORIGINS.split(',')]

    redirect_uri = request.query_params.get("redirect_uri")
    if not redirect_uri:
        raise HTTPException(status_code=400, detail="Missing redirect_uri")

    request.session["redirect"] = redirect_uri

    allowed_origins = [origin.strip() for origin in settings.GOOGLE_AUTH_ALLOWED_ORIGINS.split(',')]
    parsed_origin = f"{urlparse(redirect_uri).scheme}://{urlparse(redirect_uri).netloc}"

    # 2. Validate the origin against your whitelist
    if not parsed_origin or parsed_origin not in allowed_origins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Origin {parsed_origin} not allowed"
        )

    return await oauth.google.authorize_redirect(request, f"{settings.BACKEND_URL}/auth/google/callback")

@app.get("/auth/google/callback")
async def auth_google_callback(request: Request):
    """
    This endpoint is hit after the user logs in on Google.
    It processes the token, creates a session, and redirects to the frontend.
    """
    try:
        # This now works correctly because the code is in the request's query params
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not log in: {e}")

    user_info = token.get('userinfo')
    if not user_info or user_info.get('hd') != settings.GOOGLE_AUTH_ALLOWED_DOMAINS:
        # Redirect to a frontend error page or the login page with an error message
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain not allowed"
        )

    # Create your session cookie
    user = User(email=user_info.get('email'), name=user_info.get('name'))
    access_token = create_access_token(data={"sub": user.email, "name": user.name})
    
    redirect_destination = request.session.get("redirect")

    # Redirect the user back to the frontend's main page
    response = RedirectResponse(url=redirect_destination)
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True,
        samesite="Lax",
        secure=False,
    )
    
    return response


@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out"}