from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin_or_official
from app.schemas.analytics import (
    IncidentStatsResponse,
    TaskStatsResponse,
    IncidentTimelineResponse,
)
from app.services.analytics_service import (
    get_incident_stats,
    get_task_stats,
    get_incident_timeline,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "/incidents",
    response_model=IncidentStatsResponse,
    dependencies=[Depends(require_admin_or_official())],
)
async def analytics_incidents(
    db: AsyncSession = Depends(get_db),
):
    return await get_incident_stats(db)


@router.get(
    "/tasks",
    response_model=TaskStatsResponse,
    dependencies=[Depends(require_admin_or_official())],
)
async def analytics_tasks(
    db: AsyncSession = Depends(get_db),
):
    return await get_task_stats(db)


@router.get(
    "/incidents/timeline",
    response_model=IncidentTimelineResponse,
    dependencies=[Depends(require_admin_or_official())],
)
async def analytics_incident_timeline(
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365),
):
    return await get_incident_timeline(db, days=days)
