from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, ForeignKey, Integer

from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum as SQLAEnum,
    ForeignKey,
    DateTime,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)

    status = Column(
        SQLAEnum(TaskStatusEnum, name="task_status"),
        nullable=False,
        default=TaskStatusEnum.PENDING,
        index=True,
    )
    priority = Column(
        SQLAEnum(TaskPriorityEnum, name="task_priority"),
        nullable=False,
        default=TaskPriorityEnum.MEDIUM,
        index=True,
    )

    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    incident = relationship("Incident", back_populates="tasks", lazy="selectin")

    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assignee = relationship("User", back_populates="tasks", lazy="selectin")
    extra_data = Column("metadata", JSON, nullable=True)

    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default= datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )
