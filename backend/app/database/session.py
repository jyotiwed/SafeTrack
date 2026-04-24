from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
    AsyncEngine,
)
from sqlalchemy.pool import AsyncAdaptedQueuePool

from app.core.config import get_settings


def _build_engine() -> AsyncEngine:
    """
    Builds the async SQLAlchemy engine using settings loaded at call time,
    not at module import time. This ensures the correct DATABASE_URL is used
    whether running in development, production, or test environments.
    """
    settings = get_settings()

    # In test environment, prefer TEST_DATABASE_URL if available
    if settings.ENVIRONMENT == "test" and settings.TEST_DATABASE_URL:
        db_url = str(settings.TEST_DATABASE_URL)
    else:
        db_url = str(settings.DATABASE_URL)

    return create_async_engine(
        db_url,
        echo=settings.ENVIRONMENT == "development",  # SQL logging in dev only
        poolclass=AsyncAdaptedQueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=1800,
        future=True,
    )


def _build_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


# Module-level engine and factory — lazily initialized on first use
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = _build_engine()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = _build_session_factory(get_engine())
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an AsyncSession per request.
    Handles cleanup automatically via the context manager.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
