# app/services/user_service.py
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRoleEnum
from app.schemas.user import UserUpdate


async def get_user_profile(
    db: AsyncSession,
    user_id: int,
) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def list_users_for_admin(
    db: AsyncSession,
    role: UserRoleEnum | None = None,
    limit: int = 50,
    offset: int = 0,
) -> List[User]:
    stmt = select(User).order_by(User.id).limit(limit).offset(offset)
    if role is not None:
        stmt = stmt.where(User.role == role)
    result = await db.execute(stmt)
    return result.scalars().all() # type: ignore


async def update_user_profile(
    db: AsyncSession,
    db_user: User,
    user_in: UserUpdate,
) -> User:
    # Allow changing name always; role/is_active only for admins at endpoint layer.
    if user_in.full_name is not None:
        db_user.full_name = user_in.full_name # type: ignore
    if user_in.role is not None:
        db_user.role = UserRoleEnum(user_in.role.value) # type: ignore
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active # type: ignore

    await db.commit()
    await db.refresh(db_user)
    return db_user
