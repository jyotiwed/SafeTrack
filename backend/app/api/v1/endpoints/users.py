# app/api/v1/endpoints/users.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_db,
    get_current_user,
    require_admin,
    require_admin_or_official,
)
from app.models.user import User as UserModel, UserRoleEnum
from app.schemas.user import (
    UserRead,
    UserUpdate,
    PublicUserProfile,
    UserRole,
)
from app.services.user_service import (
    get_user_profile,
    list_users_for_admin,
    update_user_profile,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(
    current_user: UserModel = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    
    safe_update = UserUpdate(
        full_name=user_in.full_name,
        
    )
    updated = await update_user_profile(db, current_user, safe_update)
    return updated


@router.get(
    "",
    response_model=list[PublicUserProfile],
    dependencies=[Depends(require_admin_or_official())],
)
async def list_users(
    db: AsyncSession = Depends(get_db),
    role: UserRole | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    role_enum: UserRoleEnum | None = None
    if role is not None:
        role_enum = UserRoleEnum(role.value)

    users = await list_users_for_admin(
        db=db,
        role=role_enum,
        limit=limit,
        offset=offset,
    )
    return users


@router.get(
    "/{user_id}",
    response_model=PublicUserProfile,
    dependencies=[Depends(require_admin_or_official())],
)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_profile(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_admin())],
)
async def admin_update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_profile(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    updated = await update_user_profile(db, user, user_in)
    return updated
