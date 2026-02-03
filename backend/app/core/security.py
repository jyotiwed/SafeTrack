# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import hashlib

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)



def _prehash_password(password: str) -> str:
    """
    Pre-hash password using SHA-256 to avoid bcrypt 72-byte limit.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_password_hash(password: str) -> str:
    return pwd_context.hash(_prehash_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(
        _prehash_password(plain_password),
        hashed_password,
    )



def _create_token(
    subject: str,
    expires_delta: timedelta,
    secret_key: str,
    algorithm: str = settings.JWT_ALGORITHM,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def create_access_token(subject: str) -> str:
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(subject, expires, settings.JWT_SECRET_KEY)


def create_refresh_token(subject: str) -> str:
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(subject, expires, settings.JWT_REFRESH_SECRET_KEY)


def decode_access_token(token: str | None) -> Optional[str]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload.get("sub")
    except JWTError:
        return None


def decode_refresh_token(token: str | None) -> Optional[str]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload.get("sub")
    except JWTError:
        return None
