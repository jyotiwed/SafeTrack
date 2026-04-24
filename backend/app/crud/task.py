from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatusEnum, TaskPriorityEnum
from app.schemas.task import TaskCreate, TaskUpdate


async def get_task_by_id(
    db: AsyncSession,
    task_id: int,
) -> Optional[Task]:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalars().first()


async def list_tasks(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: Optional[TaskStatusEnum] = None,
    incident_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
) -> List[Task]:
    stmt = select(Task).order_by(Task.created_at.desc()).limit(limit).offset(offset)
    if status is not None:
        stmt = stmt.where(Task.status == status)
    if incident_id is not None:
        stmt = stmt.where(Task.incident_id == incident_id)
    if assignee_id is not None:
        stmt = stmt.where(Task.assignee_id == assignee_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_task(
    db: AsyncSession,
    task_in: TaskCreate,
) -> Task:
    db_obj = Task(
        title=task_in.title,
        description=task_in.description,
        status=TaskStatusEnum.PENDING,
        priority=TaskPriorityEnum(task_in.priority.value),
        incident_id=task_in.incident_id,
        assignee_id=task_in.assignee_id,
        extra_data=task_in.extra_data
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_task(
    db: AsyncSession,
    db_obj: Task,
    task_in: TaskUpdate,
) -> Task:
    if task_in.title is not None:
        db_obj.title = task_in.title # type: ignore
    if task_in.description is not None:
        db_obj.description = task_in.description # type: ignore
    if task_in.status is not None:
        db_obj.status = TaskStatusEnum(task_in.status.value if hasattr(task_in.status, 'value') else task_in.status) # type: ignore
    if task_in.priority is not None:
        db_obj.priority = TaskPriorityEnum(task_in.priority.value if hasattr(task_in.priority, 'value') else task_in.priority) # type: ignore
    if task_in.assignee_id is not None:
        db_obj.assignee_id = task_in.assignee_id # type: ignore
    if task_in.extra_data is not None:
        db_obj.extra_data = task_in.extra_data # type: ignore

    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete_task(db: AsyncSession, task_id: int) -> None:
    task = await get_task_by_id(db, task_id)
    if task:
        await db.delete(task)
        await db.commit()


class CRUDTask:
    """CRUD class for Task model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: TaskCreate) -> Task:
        """Create a new task"""
        return await create_task(db, obj_in)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[Task]:
        """Get task by ID"""
        return await get_task_by_id(db, id)
    
    async def update(self, db: AsyncSession, db_obj: Task, obj_in: TaskUpdate) -> Task:
        """Update task"""
        return await update_task(db, db_obj, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> None:
        """Delete task"""
        return await delete_task(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Task]:
        """Get multiple tasks"""
        return await list_tasks(db, limit=limit, offset=skip)
