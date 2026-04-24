
import os
os.environ["ENVIRONMENT"] = "test"

from app.core.config import get_settings
get_settings.cache_clear()


import time
import pytest
from typing import AsyncGenerator
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.database.base import Base

from app.crud.user import CRUDUser
from app.crud.incident import CRUDIncident
from app.crud.prediction import CRUDPrediction
from app.crud.task import CRUDTask
from app.crud.emergency_contact import CRUDEmergencyContact
from app.crud.guideline import CRUDGuideline
from app.crud.incident_prediction import CRUDIncidentPrediction

from app.models.user import User
from app.models.incident import Incident
from app.schemas.user import UserCreate




@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    settings = get_settings()

    test_db_url = getattr(settings, "TEST_DATABASE_URL", None)
    if not test_db_url:
        raise RuntimeError(
            "TEST_DATABASE_URL must be set. "
            "Refusing to run tests on main database."
        )

    engine = create_async_engine(
        str(test_db_url),
        echo=False,
        future=True,
        poolclass=NullPool,  
    )

    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async_session_local = async_sessionmaker(
        engine,
        expire_on_commit=False,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
    )

    db_session = async_session_local()
    try:
        yield db_session
    finally:
        await db_session.rollback()
        await db_session.close()

   
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_db: AsyncSession) -> AsyncSession:  # ✅ fixed return type
    return test_db




@pytest.fixture
def crud_user() -> CRUDUser:
    return CRUDUser(User)


@pytest.fixture
def crud_incident() -> CRUDIncident:
    return CRUDIncident(Incident)


@pytest.fixture
def crud_prediction() -> CRUDPrediction:
    from app.models.prediction import Prediction
    return CRUDPrediction(Prediction)


@pytest.fixture
def crud_task() -> CRUDTask:
    from app.models.task import Task
    return CRUDTask(Task)


@pytest.fixture
def crud_emergency_contact() -> CRUDEmergencyContact:
    from app.models.emergency_contact import EmergencyContact
    return CRUDEmergencyContact(EmergencyContact)


@pytest.fixture
def crud_guideline() -> CRUDGuideline:
    from app.models.guideline import Guideline
    return CRUDGuideline(Guideline)


@pytest.fixture
def crud_incident_prediction() -> CRUDIncidentPrediction:
    from app.models.incident_prediction import IncidentPrediction
    return CRUDIncidentPrediction(IncidentPrediction)



@pytest.fixture
async def auth_service(db_session: AsyncSession):
    from app.services.auth_service import AuthService
    return AuthService(db_session)


@pytest.fixture
async def incident_service(db_session: AsyncSession):
    from app.services.incident_service import IncidentService
    return IncidentService(db_session)


@pytest.fixture
async def prediction_service(db_session: AsyncSession, crud_prediction: CRUDPrediction):
    from app.services.ml_service import PredictionService
    return PredictionService(db_session, prediction_crud=crud_prediction)


@pytest.fixture
async def analytics_service(db_session: AsyncSession):
    from app.services.analytics_service import AnalyticsService
    return AnalyticsService(db_session)


@pytest.fixture
async def emergency_service(db_session: AsyncSession):
    from app.services.emergency_service import EmergencyService
    return EmergencyService(db_session)


@pytest.fixture
async def user_service(db_session: AsyncSession):
    from app.services.user_service import UserService
    return UserService(db_session)


@pytest.fixture
async def geospatial_service(db_session: AsyncSession):
    from app.services.geospatial_service import GeospatialService
    return GeospatialService(db_session)




@pytest.fixture
async def test_user(db_session: AsyncSession, crud_user: CRUDUser) -> User:
    user_data = UserCreate(
        email=f"testuser_{int(time.time() * 1000)}@example.com",  
        full_name="Test User",
        password="TestPassword123"
    )
    return await crud_user.create(db_session, obj_in=user_data)


@pytest.fixture
async def user_id(test_user: User) -> int:
    return test_user.id  # type: ignore


@pytest.fixture
async def test_incident(
    db_session: AsyncSession,
    crud_incident: CRUDIncident,
    user_id: int
) -> Incident:
    from app.schemas.incident import IncidentCreate

    incident_data = IncidentCreate(
        title="Test Incident",
        description="Test Description",
        address=None,
        severity="high",
        latitude=20.5937,
        longitude=78.9629
    )

    return await crud_incident.create(
        db_session,
        obj_in=incident_data,
        reporter_id=user_id
    )


@pytest.fixture
async def incident_id(test_incident: Incident) -> int:
    return test_incident.id  # type: ignore


@pytest.fixture
async def test_prediction(
    db_session: AsyncSession,
    crud_prediction: CRUDPrediction,
    incident_id: int
):
    from app.schemas.prediction import PredictionCreate
    from app.models.prediction import RiskTypeEnum

    pred_data = PredictionCreate(
        risk_type=RiskTypeEnum.FLOOD,
        incident_id=incident_id,
        probability=0.75,
        confidence_score=0.85
    )
    return await crud_prediction.create(db_session, obj_in=pred_data)


@pytest.fixture
async def prediction_id(test_prediction) -> int:
    return test_prediction.id


@pytest.fixture
async def test_task(
    db_session: AsyncSession,
    crud_task: CRUDTask,
    user_id: int,
    incident_id: int
):
    from app.schemas.task import TaskCreate, TaskPriority

    task_data = TaskCreate(
        title="Test Task",
        description="Test Task Description",
        incident_id=incident_id,
        assignee_id=user_id,
        priority=TaskPriority.MEDIUM
    )
    return await crud_task.create(db_session, obj_in=task_data)


@pytest.fixture
async def task_id(test_task) -> int:
    return test_task.id