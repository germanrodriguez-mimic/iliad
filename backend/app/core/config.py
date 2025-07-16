from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Robotics Data Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    CLOUDSQL_INSTANCE: str  # Format: project:region:instance
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    CONNECTION_TYPE: str
    
    # Connection pool settings for better performance
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600  # 1 hour
    
    GCP_MEDIA_BUCKET_NAME: str

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 