from typing import List

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geometry,Geography

from app.models.incident import Incident
from app.models.user import User


def point_from_lat_lon(latitude: float, longitude: float):
    """
    Create a PostGIS POINT (lon, lat) in WGS84 (SRID 4326).
    """
    return from_shape(Point(float(longitude), float(latitude)), srid=4326)


async def get_incidents_within_radius(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float,
    limit: int = 50,
    offset: int = 0,
) -> List[Incident]:
    """
    Incidents whose location is within radius_meters of (lat, lon),
    using ST_DWithin on geometry::geography for meter-based distance.
    """
    ref_point = point_from_lat_lon(latitude, longitude)

    stmt = (
        select(Incident)
        .where(
            func.ST_DWithin(
                Incident.location.cast(Geometry("POINT", srid=4326)).cast("geography"),
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


async def get_users_within_radius(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float,
    limit: int = 200,
    offset: int = 0,
) -> List[User]:
    """
    Users whose location (if you store one) is within radius_meters of (lat, lon).
    Requires a Geometry POINT column on User, e.g. User.location with SRID 4326.
    """
    ref_point = point_from_lat_lon(latitude, longitude)

    if not hasattr(User, "location"):
        return []

    stmt = (
        select(User)
        .where(
            func.ST_DWithin(
                User.location.cast(Geometry("POINT", srid=4326)).cast("geography"),
                ref_point.cast("geography"),
                radius_meters,
            )
        )
        .order_by(User.id)
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
