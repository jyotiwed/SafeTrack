from typing import List

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import func, select, cast
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from app.models.incident import Incident


def point_from_lat_lon(latitude: float, longitude: float):
    """
    Create a PostGIS POINT (lon, lat) in SRID 4326
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
    Return incidents within radius (meters) using ST_DWithin
    """

    ref_point = point_from_lat_lon(latitude, longitude)

    stmt = (
        select(Incident)
        .where(
            func.ST_DWithin(
                cast(Incident.location, Geography),  # ✅ correct cast
                cast(ref_point, Geography),          # ✅ correct cast
                radius_meters,
            )
        )
        .order_by(Incident.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)
    return list(result.scalars().all())
