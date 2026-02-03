# app/services/auth_service.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.crud.user import get_user_by_email, get_user_by_id
from app.schemas.user import TokenPair


class InvalidCredentialsError(Exception):
    """Raised when email or password is invalid."""
    pass


class InactiveUserError(Exception):
    """Raised when a user account is inactive."""
    pass


class InvalidRefreshTokenError(Exception):
    """Raised when a refresh token is invalid."""
    pass


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> TokenPair:
    user = await get_user_by_email(db, email=email)
    if not user:
        raise InvalidCredentialsError("Invalid email or password")

    if not verify_password(password, user.hashed_password):  # type: ignore[attr-defined]
        raise InvalidCredentialsError("Invalid email or password")

    if not user.is_active:  # type: ignore[attr-defined]
        raise InactiveUserError("User is inactive")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    return TokenPair(access_token=access, refresh_token=refresh)


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenPair:
    subject = decode_refresh_token(refresh_token)
    if subject is None:
        raise InvalidRefreshTokenError("Invalid refresh token")

    user_id = int(subject)
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:  # type: ignore[attr-defined]
        raise InvalidRefreshTokenError("Invalid refresh token")

    access = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))
    return TokenPair(access_token=access, refresh_token=new_refresh)
async def get_current_user(db: AsyncSession, user_id: int):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise InvalidCredentialsError("User not found")
    return user
async def get_current_active_user(db: AsyncSession, user_id: int):
    user = await get_current_user(db, user_id)
    if not user.is_active:  # type: ignore[attr-defined]
        raise InactiveUserError("User is inactive")
    return user
async def get_current_active_admin(db: AsyncSession, user_id: int):
    user = await get_current_active_user(db, user_id)
    if user.role != "admin":  # type: ignore[attr-defined]
        raise InvalidCredentialsError("User is not an admin")
    return user
