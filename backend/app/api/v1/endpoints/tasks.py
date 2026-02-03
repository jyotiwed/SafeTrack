from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_db,
    get_current_user,
    require_operational_roles,
)
from app.models.task import TaskStatusEnum
from app.models.user import User as UserModel
from app.schemas.task import TaskCreate, TaskUpdate, TaskRead
from app.services.task_service import (
    create_task as service_create_task,
    list_tasks as service_list_tasks,
    get_task as service_get_task,
    update_task as service_update_task,
    TaskNotFoundError,
    IncidentNotFoundError,
    AssigneeNotFoundError,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_operational_roles())],
)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        task = await service_create_task(db, task_in)
        return task
    except IncidentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except AssigneeNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[TaskRead],
    dependencies=[Depends(require_operational_roles())],
)
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    status: Optional[TaskStatusEnum] = Query(default=None),
    incident_id: Optional[int] = Query(default=None),
    assignee_id: Optional[int] = Query(default=None),
):
    tasks = await service_list_tasks(
        db=db,
        limit=limit,
        offset=offset,
        status=status,
        incident_id=incident_id,
        assignee_id=assignee_id,
    )
    return tasks


@router.get(
    "/{task_id}",
    response_model=TaskRead,
    dependencies=[Depends(require_operational_roles())],
)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        task = await service_get_task(db, task_id)
        return task
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/{task_id}",
    response_model=TaskRead,
    dependencies=[Depends(require_operational_roles())],
)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        task = await service_update_task(db, task_id, task_in)
        return task
    except TaskNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except AssigneeNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
