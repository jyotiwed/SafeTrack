from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.incident import (
    create_incident as crud_create_incident,
    list_incidents as crud_list_incidents,
    get_incident_by_id as crud_get_incident_by_id,
    update_incident as crud_update_incident,
)
from app.models.incident import Incident, IncidentStatusEnum
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.services.notification_service import broadcast_incident_created
from app.utils.geospatial import get_incidents_within_radius


class IncidentNotFoundError(Exception):
    pass


async def create_incident(
    db: AsyncSession,
    incident_in: IncidentCreate,
    reporter_id: int,
) -> Incident:
    incident = await crud_create_incident(db, incident_in, reporter_id)
    await broadcast_incident_created(incident)
    return incident


async def get_incident(
    db: AsyncSession,
    incident_id: int,
) -> Incident:
    incident = await crud_get_incident_by_id(db, incident_id)
    if not incident:
        raise IncidentNotFoundError("Incident not found")
    return incident


async def list_incidents(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: Optional[IncidentStatusEnum] = None,
) -> List[Incident]:
    return await crud_list_incidents(db, limit=limit, offset=offset, status=status)


async def update_incident(
    db: AsyncSession,
    incident_id: int,
    incident_in: IncidentUpdate,
) -> Incident:
    incident = await crud_get_incident_by_id(db, incident_id)
    if not incident:
        raise IncidentNotFoundError("Incident not found")

    return await crud_update_incident(db, incident, incident_in)


async def list_incidents_near(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float,
    limit: int = 50,
    offset: int = 0,
) -> list[Incident]:
    return await get_incidents_within_radius(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        limit=limit,
        offset=offset,
    )
