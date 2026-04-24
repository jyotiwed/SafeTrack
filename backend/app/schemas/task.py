from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    extra_data: Dict[str, Any] | None = None



class TaskCreate(TaskBase):
    incident_id: int
    assignee_id: int | None = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None



class TaskRead(TaskBase):
    id: int
    status: TaskStatus
    incident_id: int
    assignee_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
