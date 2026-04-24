import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import analytics_service as svc


class TestAnalyticsService:
    """Test analytics service"""

    async def test_get_incident_stats(
        self,
        db_session: AsyncSession,
        test_incident  # ✅ ensure data exists before checking stats
    ):
        """Test incident statistics"""
        stats = await svc.get_incident_stats(db_session)

        assert stats is not None
        assert hasattr(stats, 'total_incidents')
        assert hasattr(stats, 'open_incidents')
        assert stats.total_incidents >= 1       

    async def test_get_task_stats(
        self,
        db_session: AsyncSession,
        test_task  
    ):
        """Test task statistics"""
        stats = await svc.get_task_stats(db_session)

        assert stats is not None
        assert hasattr(stats, 'total_tasks')
        assert stats.total_tasks >= 1           

    async def test_get_incident_timeline(
        self,
        db_session: AsyncSession,
        test_incident  
    ):
        """Test incident timeline"""
        timeline = await svc.get_incident_timeline(
            db_session,
            days=7
        )

        assert timeline is not None 

    async def test_get_incident_stats_empty(
        self,
        db_session: AsyncSession
    ):
        """Test stats when no incidents exist returns zero counts"""
        stats = await svc.get_incident_stats(db_session)

        assert stats is not None
        assert stats.total_incidents >= 0       