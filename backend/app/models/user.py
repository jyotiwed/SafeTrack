# app/models/user.py
from enum import Enum

from sqlalchemy import Boolean, Column, Enum as SQLAEnum, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class UserRoleEnum(str, Enum):
    CITIZEN = "citizen"
    VOLUNTEER = "volunteer"
    NGO = "ngo"
    ADMIN = "admin"
    OFFICIAL = "official"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLAEnum(UserRoleEnum, name="user_role"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    incidents = relationship(
        "Incident",
        back_populates="reporter",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    tasks = relationship(
        "Task",
        back_populates="assignee",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    guidelines = relationship("Guideline", back_populates="author")
