# app/core/dependencies.py
from typing import Annotated
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import decode_access_token
from app.crud.user import get_user_by_id
from app.database.session import get_db as _get_db
from app.models.user import UserRoleEnum, User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)


# DB dependency (unchanged logic)
async def get_db() -> AsyncGenerator[AsyncSession, None]    :
    async for session in _get_db():
        yield session


async def get_optional_token(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> str | None:
    return token


# Current user dependency
async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = await get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


# Role-based dependency factory
def require_role(*allowed_roles: UserRoleEnum):
    async def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


def require_admin():
    return require_role(UserRoleEnum.ADMIN)


def require_admin_or_official():
    return require_role(UserRoleEnum.ADMIN, UserRoleEnum.OFFICIAL)


def require_operational_roles():
    return require_role(
        UserRoleEnum.VOLUNTEER,
        UserRoleEnum.NGO,
        UserRoleEnum.ADMIN,
        UserRoleEnum.OFFICIAL,
    )
def require_volunteer():
    return require_role(UserRoleEnum.VOLUNTEER)
def require_ngo():
    return require_role(UserRoleEnum.NGO)
def require_official():
    return require_role(UserRoleEnum.OFFICIAL)
def require_admin_official_or_ngo():
    return require_role(
        UserRoleEnum.ADMIN,
        UserRoleEnum.OFFICIAL,
        UserRoleEnum.NGO,
    )
def require_any_authenticated_user():
    async def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        return current_user

    return dependency
def require_no_authentication():
    async def dependency(
        token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    ) -> None:
        if token is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already authenticated",
            )

    return dependency
