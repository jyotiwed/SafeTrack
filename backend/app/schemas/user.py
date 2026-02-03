# app/schemas/user.py
from enum import Enum
from typing import Optional, Annotated

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    CITIZEN = "citizen"
    VOLUNTEER = "volunteer"
    NGO = "ngo"
    ADMIN = "admin"
    OFFICIAL = "official"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: UserRole = UserRole.CITIZEN
    


class UserCreate(UserBase):
    password: Annotated[str, Field(min_length=8, max_length=128)]


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PublicUserProfile(BaseModel):
    id: int
    full_name: str | None = None
    role: UserRole

    class Config:
        from_attributes = True

