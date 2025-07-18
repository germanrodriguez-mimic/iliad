from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from fastapi import Request, status, HTTPException
from authlib.integrations.starlette_client import OAuth
from jose import JWTError, jwt
from app.core.config import settings

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_AUTH_CLIENT_ID,
    client_secret=settings.GOOGLE_AUTH_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

class AuthRequest(BaseModel):
    code: str
    redirect_uri: str

class User(BaseModel):
    email: EmailStr
    name: str

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 Days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.GOOGLE_AUTH_SECRET_KEY, algorithm="HS256")

async def get_current_user(request: Request) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.GOOGLE_AUTH_SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        name: str = payload.get("name")
        if email is None:
            raise credentials_exception
        return User(email=email, name=name)
    except JWTError:
        raise credentials_exception