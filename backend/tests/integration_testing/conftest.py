import os
os.environ["ENVIRONMENT"] = "test"

from app.core.config import get_settings
get_settings.cache_clear()

import pytest
import time
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.database.base import Base
from app.main import app
from app.database.session import get_db
from app.schemas.user import UserCreate
from app.crud.user import CRUDUser
from app.models.user import User
from app.core.security import create_access_token


@pytest.fixture(scope="function")
async def client():
    settings = get_settings()

   
    if settings.ENVIRONMENT == "test" and settings.TEST_DATABASE_URL:
        db_url = str(settings.TEST_DATABASE_URL)
    else:
        raise RuntimeError("TEST_DATABASE_URL not set. Refusing to run tests on main DB.")

    engine = create_async_engine(
        db_url,
        echo=False,
        poolclass=NullPool,
    )

    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(
        engine,
        expire_on_commit=False,
        class_=AsyncSession,
        autoflush=False,
        autocommit=False,
    )

   
    db_session = AsyncSessionLocal()

    try:
       
        crud_user = CRUDUser(User)
        unique_suffix = str(int(time.time() * 1000000) % 1000000)
        user_data = UserCreate(
            email=f"testuser{unique_suffix}@example.com",
            full_name="Test User",
            password="TestPassword123",
        )
        user = await crud_user.create(db_session, obj_in=user_data)

        
        async def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db

        transport = ASGITransport(app=app)

        async with AsyncClient(
            transport=transport,
            base_url="http://testserver"
        ) as ac:

            token = create_access_token(subject=str(user.id))

            
            object.__setattr__(ac, "auth_token", token)
            object.__setattr__(ac, "test_user_id", user.id)
            object.__setattr__(ac, "db_session", db_session)

            yield ac 
    finally:
        
        app.dependency_overrides.clear()
        await db_session.close()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        await engine.dispose()


@pytest.fixture
async def test_incident(client):
    """Create a test incident using the client's db session."""
    from app.crud.incident import CRUDIncident
    from app.models.incident import Incident
    from app.schemas.incident import IncidentCreate

    db_session = client.db_session
    crud_incident = CRUDIncident(Incident)

    incident_data = IncidentCreate(
        title="Test Incident",
        description="Test Description",
        address=None,
        severity="high",
        latitude=20.5937,
        longitude=78.9629,
    )

    return await crud_incident.create(
        db_session,
        obj_in=incident_data,
        reporter_id=client.test_user_id
    )