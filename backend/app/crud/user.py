# app/crud/user.py
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRoleEnum
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import create_password_hash


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise ValueError("Email already registered")

    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=create_password_hash(user_in.password),
        role=UserRoleEnum(user_in.role.value),
        is_active=True,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(db: AsyncSession, db_user: User, user_in: UserUpdate) -> User:
    if user_in.full_name is not None:
        db_user.full_name = user_in.full_name # type: ignore
    if user_in.role is not None:
        db_user.role = UserRoleEnum(user_in.role.value) # type: ignore
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active # type: ignore

    await db.commit()
    await db.refresh(db_user)
    return db_user
