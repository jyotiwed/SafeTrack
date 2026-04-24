# app/crud/user.py
from typing import Optional
from typing import List

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


async def delete_user(db: AsyncSession, user_id: int) -> None:
    user = await get_user_by_id(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()


async def get_users_multi(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()  # type: ignore


class CRUDUser:
    """CRUD class for User model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: UserCreate) -> User:
        """Create a new user"""
        return await create_user(db, obj_in)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[User]:
        """Get user by ID"""
        return await get_user_by_id(db, id)
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        return await get_user_by_email(db, email)
    
    async def update(self, db: AsyncSession, db_obj: User, obj_in: UserUpdate) -> User:
        """Update user"""
        return await update_user(db, db_obj, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> None:
        """Delete user"""
        return await delete_user(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[User]:
        """Get multiple users"""
        return await get_users_multi(db, skip, limit)
