from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.task import (
    get_task_by_id as crud_get_task_by_id,
    list_tasks as crud_list_tasks,
    create_task as crud_create_task,
    update_task as crud_update_task,
)
from app.crud.incident import get_incident_by_id
from app.crud.user import get_user_by_id
from app.models.task import Task, TaskStatusEnum
from app.schemas.task import TaskCreate, TaskUpdate


class TaskNotFoundError(Exception):
    pass


class IncidentNotFoundError(Exception):
    pass


class AssigneeNotFoundError(Exception):
    pass


async def create_task(
    db: AsyncSession,
    task_in: TaskCreate,
) -> Task:
    incident = await get_incident_by_id(db, task_in.incident_id)
    if not incident:
        raise IncidentNotFoundError("Incident not found")

    if task_in.assignee_id is not None:
        assignee = await get_user_by_id(db, task_in.assignee_id)
        if not assignee:
            raise AssigneeNotFoundError("Assignee not found")

    return await crud_create_task(db, task_in)


async def get_task(
    db: AsyncSession,
    task_id: int,
) -> Task:
    task = await crud_get_task_by_id(db, task_id)
    if not task:
        raise TaskNotFoundError("Task not found")
    return task


async def list_tasks(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: Optional[TaskStatusEnum] = None,
    incident_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
) -> List[Task]:
    return await crud_list_tasks(
        db=db,
        limit=limit,
        offset=offset,
        status=status,
        incident_id=incident_id,
        assignee_id=assignee_id,
    )


async def update_task(
    db: AsyncSession,
    task_id: int,
    task_in: TaskUpdate,
) -> Task:
    task = await crud_get_task_by_id(db, task_id)
    if not task:
        raise TaskNotFoundError("Task not found")

    if task_in.assignee_id is not None:
        assignee = await get_user_by_id(db, task_in.assignee_id)
        if not assignee:
            raise AssigneeNotFoundError("Assignee not found")

    return await crud_update_task(db, task, task_in)
