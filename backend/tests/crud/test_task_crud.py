import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.task import CRUDTask                      
from app.schemas.task import TaskCreate, TaskUpdate, TaskPriority, TaskStatus  


class TestTaskCRUD:
    """Test cases for Task CRUD operations"""

    async def test_create_task(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        user_id: int,
        incident_id: int
    ):
        """Test creating a new task"""
        task_data = TaskCreate(
            title="Evacuation Plan",
            description="Create evacuation plan for flood affected areas",
            incident_id=incident_id,
            assignee_id=user_id,
            priority=TaskPriority.HIGH
        )
        task = await crud_task.create(db_session, obj_in=task_data)

        assert task.title == "Evacuation Plan"
        assert task.priority == TaskPriority.HIGH       
        assert task.assignee_id == user_id              
        assert task.incident_id == incident_id          
        assert task.id is not None                      

    async def test_get_task_by_id(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        task_id: int
    ):
        """Test retrieving task by ID"""
        task = await crud_task.get(db_session, id=task_id)
        assert task is not None                         
        assert task.id == task_id

    async def test_get_task_by_status(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        user_id: int,
        incident_id: int
    ):
        """Test filtering tasks by status"""
        
        for i in range(2):
            await crud_task.create(
                db_session,
                obj_in=TaskCreate(
                    title=f"Status Task {i}",
                    description="Task for testing status based filtering",
                    incident_id=incident_id,
                    assignee_id=user_id,
                    priority=TaskPriority.MEDIUM
                )
            )

        tasks = await crud_task.get_multi(db_session)
        assert len(tasks) > 0                           

       
        pending = [t for t in tasks if t.status == TaskStatus.PENDING]
        assert len(pending) >= 1

    async def test_update_task_progress(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        task_id: int
    ):
        """Test updating task status"""
        task = await crud_task.get(db_session, id=task_id)
        assert task is not None

        update = TaskUpdate(status=TaskStatus.IN_PROGRESS)
        updated = await crud_task.update(
            db_session,
            db_obj=task,
            obj_in=update
        )

        assert updated.status == TaskStatus.IN_PROGRESS 
        assert updated.id == task_id                    
    async def test_delete_task(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        user_id: int,
        incident_id: int
    ):
        """Test deleting a task"""
        task = await crud_task.create(
            db_session,
            obj_in=TaskCreate(
                title="Task To Delete",
                description="This task will be deleted as part of delete test",
                incident_id=incident_id,
                assignee_id=user_id,
                priority=TaskPriority.LOW
            )
        )

        await crud_task.remove(db_session, id=task.id)
        deleted = await crud_task.get(db_session, id=task.id)
        assert deleted is None                         

    async def test_get_tasks_by_assignee(
        self,
        crud_task: CRUDTask,
        db_session: AsyncSession,
        user_id: int,
        incident_id: int
    ):
        """Test retrieving tasks assigned to a specific user"""
       
        for i in range(2):
            await crud_task.create(
                db_session,
                obj_in=TaskCreate(
                    title=f"Assigned Task {i}",
                    description="Task assigned to the test user for retrieval test",
                    incident_id=incident_id,
                    assignee_id=user_id,
                    priority=TaskPriority.MEDIUM
                )
            )

        tasks = await crud_task.get_multi(db_session)
        user_tasks = [t for t in tasks if t.assignee_id == user_id]

        assert len(user_tasks) >= 2                     
        assert all(t.assignee_id == user_id for t in user_tasks)