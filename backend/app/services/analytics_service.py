from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Incident
from app.models.task import Task
from app.schemas.analytics import (
    IncidentStatsResponse,
    TaskStatsResponse,
    TimeBucketCount,
    IncidentTimelineResponse,
)


async def get_incident_stats(db: AsyncSession) -> IncidentStatsResponse:
    # total
    total_q = await db.execute(select(func.count(Incident.id)))
    total_incidents = total_q.scalar_one() or 0

    # open/closed (assuming status field)
    open_q = await db.execute(
        select(func.count(Incident.id)).where(Incident.status != "closed")
    )
    open_incidents = open_q.scalar_one() or 0

    closed_q = await db.execute(
        select(func.count(Incident.id)).where(Incident.status == "closed")
    )
    closed_incidents = closed_q.scalar_one() or 0

    # by severity
    by_severity_q = await db.execute(
        select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
    )
    by_severity = {row[0]: row[1] for row in by_severity_q.all()}

    # by type (if you have incident_type field)
    if hasattr(Incident, "incident_type"):
        by_type_q = await db.execute(
            select(Incident.incident_type, func.count(Incident.id)).group_by(
                Incident.incident_type
            )
        )
        by_type = {row[0]: row[1] for row in by_type_q.all()}
    else:
        by_type = {}

    return IncidentStatsResponse(
        total_incidents=total_incidents,
        open_incidents=open_incidents,
        closed_incidents=closed_incidents,
        by_severity=by_severity,
        by_type=by_type,
    )


async def get_task_stats(db: AsyncSession) -> TaskStatsResponse:
    total_q = await db.execute(select(func.count(Task.id)))
    total_tasks = total_q.scalar_one() or 0

    open_q = await db.execute(
        select(func.count(Task.id)).where(Task.status != "completed")
    )
    open_tasks = open_q.scalar_one() or 0

    completed_q = await db.execute(
        select(func.count(Task.id)).where(Task.status == "completed")
    )
    completed_tasks = completed_q.scalar_one() or 0

    return TaskStatsResponse(
        total_tasks=total_tasks,
        open_tasks=open_tasks,
        completed_tasks=completed_tasks,
    )


async def get_incident_timeline(
    db: AsyncSession,
    days: int = 30,
) -> IncidentTimelineResponse:
    """
    Simple per-day counts for last `days` days based on created_at.
    """
    end = datetime.utcnow().date()
    start = end - timedelta(days=days - 1)

    buckets: List[TimeBucketCount] = []

    # group by date(created_at)
    q = await db.execute(
        select(func.date(Incident.created_at), func.count(Incident.id))
        .where(func.date(Incident.created_at) >= start)
        .group_by(func.date(Incident.created_at))
        .order_by(func.date(Incident.created_at))
    )
    counts = {row[0]: row[1] for row in q.all()}

    current = start
    while current <= end:
        buckets.append(
            TimeBucketCount(
                period_start=datetime.combine(current, datetime.min.time()),
                count=counts.get(current, 0),
            )
        )
        current += timedelta(days=1)

    return IncidentTimelineResponse(buckets=buckets)
