from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Robotics Data Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str
    GCP_MEDIA_BUCKET_NAME: str

    @property
    def get_database_url(self) -> str:
        return self.DATABASE_URL

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 