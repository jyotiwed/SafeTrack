from typing import List, Optional
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession

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

class IncidentService:
    """
    Incident operations. Inject `incident_crud` implementing create/get/update/delete/list.
    """

    def __init__(self, db: AsyncSession, incident_crud=None):
        self.db = db
        self.incident_crud = incident_crud

    async def create(self, incident_in):
        if not self.incident_crud:
            raise RuntimeError("incident_crud required")
        return await self.incident_crud.create(self.db, obj_in=incident_in)

    async def get(self, incident_id: int) -> Optional[object]:
        if not self.incident_crud:
            raise RuntimeError("incident_crud required")
        return await self.incident_crud.get(self.db, id=incident_id)

    async def update(self, incident_obj, obj_in):
        if not self.incident_crud:
            raise RuntimeError("incident_crud required")
        return await self.incident_crud.update(self.db, db_obj=incident_obj, obj_in=obj_in)

    async def delete(self, incident_id: int) -> Optional[object]:
        if not self.incident_crud:
            raise RuntimeError("incident_crud required")
        return await self.incident_crud.delete(self.db, id=incident_id)

    async def list_nearby(self, lat: float, lng: float, radius_meters: float) -> Sequence[object]:
        if not self.incident_crud:
            raise RuntimeError("incident_crud required")
        return await self.incident_crud.list_nearby(self.db, lat=lat, lng=lng, radius_meters=radius_meters)