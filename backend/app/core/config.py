from functools import lru_cache
from typing import List, Optional

from pydantic import AnyUrl, HttpUrl
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SafeTrack"
    ENVIRONMENT: str = "development"

    DATABASE_URL: AnyUrl
    REDIS_URL: AnyUrl

    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    PASSWORD_HASH_ROUNDS: int = 12

    # CORS
    BACKEND_CORS_ORIGINS: List[HttpUrl] | List[str] | str | None = None

    # S3 / MinIO (optional)
    S3_ENDPOINT_URL: Optional[AnyUrl] = None
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    S3_USE_SSL: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
