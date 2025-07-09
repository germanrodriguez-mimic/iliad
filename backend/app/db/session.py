from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from google.cloud.sql.connector import Connector
import os
import logging
from google.oauth2 import service_account

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Initialize Cloud SQL Python Connector with explicit credentials
def create_connector():
    """Create a Cloud SQL Connector with explicit service account credentials."""
    # Get the service account file path from environment
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if credentials_path and os.path.exists(credentials_path):
        logger.info(f"Using service account credentials from: {credentials_path}")
        # Load credentials from service account file
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        return Connector(credentials=credentials)
    else:
        logger.warning("No service account file found, using default credentials")
        # Fallback to default credentials (for development)
        return Connector()

connector = create_connector()

def getconn():
    """
    Get a database connection using Cloud SQL Python Connector.
    This replaces the proxy-based connection for better performance.
    """
    try:
        logger.debug(f"Connecting to Cloud SQL instance: {settings.CLOUDSQL_INSTANCE}")
        logger.debug(f"Database: {settings.DB_NAME}, User: {settings.DB_USER}")
        
        # Use the correct parameter format for pg8000
        conn = connector.connect(
            settings.CLOUDSQL_INSTANCE,
            "pg8000",
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            db=settings.DB_NAME,  # Use 'db' as expected by Cloud SQL Connector
        )
        logger.debug("Successfully connected to Cloud SQL")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to Cloud SQL: {str(e)}")
        logger.error(f"Instance: {settings.CLOUDSQL_INSTANCE}")
        logger.error(f"Database: {settings.DB_NAME}")
        logger.error(f"User: {settings.DB_USER}")
        raise

# Create engine with Cloud SQL Connector
engine = create_engine(
    "postgresql+pg8000://",
    creator=getconn,
    poolclass=QueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,  # Verify connections before use
    echo=False,  # Set to True for SQL query logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Cleanup function for the connector
def cleanup_connector():
    """Clean up the Cloud SQL connector when the application shuts down."""
    if connector:
        connector.close() 