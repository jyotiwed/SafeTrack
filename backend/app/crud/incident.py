from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.models.incident import Incident, IncidentStatusEnum
from app.schemas.incident import IncidentCreate, IncidentUpdate


async def get_incident_by_id(
    db: AsyncSession,
    incident_id: int,
) -> Optional[Incident]:
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    return result.scalars().first()


async def list_incidents(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    status: Optional[IncidentStatusEnum] = None,
) -> List[Incident]:
    stmt = (
        select(Incident)
        .order_by(Incident.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if status is not None:
        stmt = stmt.where(Incident.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()  # type: ignore


def _build_point(latitude: float | None, longitude: float | None):
    if latitude is None or longitude is None:
        return None
    # shapely Point -> GeoAlchemy WKBElement (lon, lat)
    shape = Point(float(longitude), float(latitude))
    return from_shape(shape, srid=4326)


async def create_incident(
    db: AsyncSession,
    incident_in: IncidentCreate,
    reporter_id: int,
) -> Incident:
    location = _build_point(incident_in.latitude, incident_in.longitude)

    db_obj = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,  # Already a string from schema
        status=IncidentStatusEnum.NEW,
        address=incident_in.address,
        location=location,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        reporter_id=reporter_id,
        media_urls=incident_in.media_urls or [],
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_incident(
    db: AsyncSession,
    db_obj: Incident,
    incident_in: IncidentUpdate,
) -> Incident:
    if incident_in.title is not None:
        db_obj.title = incident_in.title  # type: ignore
    if incident_in.description is not None:
        db_obj.description = incident_in.description  # type: ignore
    if incident_in.severity is not None:
        db_obj.severity = incident_in.severity.value # type: ignore
        db_obj.severity = incident_in.severity.value# type: ignore
    if incident_in.status is not None:
        db_obj.status = incident_in.status  # type: ignore
    if incident_in.address is not None:
        db_obj.address = incident_in.address  # type: ignore

    # keep coordinates + geometry in sync
    if incident_in.latitude is not None:
        db_obj.latitude = incident_in.latitude  # type: ignore
    if incident_in.longitude is not None:
        db_obj.longitude = incident_in.longitude  # type: ignore

    if db_obj.latitude is not None and db_obj.longitude is not None:
        db_obj.location = _build_point(db_obj.latitude, db_obj.longitude)  # type: ignore

    if incident_in.media_urls is not None:
        db_obj.media_urls = incident_in.media_urls  # type: ignore

    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def list_incidents_near_location(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float,
    limit: int = 50,
    offset: int = 0,
) -> list[Incident]:
    """
    Return incidents within radius_meters of (lat, lon).
    Uses ST_DWithin with geometry::geography for meter-based radius.
    """
    ref_point = from_shape(Point(float(longitude), float(latitude)), srid=4326)

    stmt = (
        select(Incident)
        .where(
            func.ST_DWithin(
                Incident.location.cast(Geometry("POINT", srid=4326)).cast("geography"), # type: ignore
                ref_point.cast("geography"),
                radius_meters,
            )
        )
        .order_by(Incident.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def delete_incident(db: AsyncSession, incident_id: int) -> None:
    incident = await get_incident_by_id(db, incident_id)
    if incident:
        await db.delete(incident)
        await db.commit()

class CRUDIncident:
    """CRUD class for Incident model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: IncidentCreate, reporter_id: int = None, **kwargs) -> Incident: # type: ignore
        """Create a new incident"""
        return await create_incident(db, obj_in, reporter_id or 1)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[Incident]:
        """Get incident by ID"""
        return await get_incident_by_id(db, id)
    
    async def update(self, db: AsyncSession, db_obj: Incident, obj_in: IncidentUpdate) -> Incident:
        """Update incident"""
        return await update_incident(db, db_obj, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> None:
        """Delete incident"""
        return await delete_incident(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Incident]:
        """Get multiple incidents"""
        return await list_incidents(db, limit=limit, offset=skip)
