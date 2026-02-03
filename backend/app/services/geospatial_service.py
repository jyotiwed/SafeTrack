from typing import List, cast
from shapely import points
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Incident
from app.schemas.geospatial import MapPoint, Cluster
from app.utils.clustering import cluster_points


async def get_incident_points(
    db: AsyncSession,
    limit: int = 1000,
) -> List[MapPoint]:
    result = await db.execute(
        select(Incident).order_by(Incident.created_at.desc()).limit(limit)
    )
    incidents = result.scalars().all()

    points: List[MapPoint] = []

    from typing import List, cast

# ...

    for inc in incidents:
        lat = getattr(inc, "latitude", None)
        lon = getattr(inc, "longitude", None)
        if lat is None or lon is None:
            continue
        points.append(
            MapPoint(
                id=inc.id, # type: ignore
                latitude=lat,
                longitude=lon,
                type="incident",
                properties={
                    "severity": getattr(inc, "severity", None),
                    "status": getattr(inc, "status", None),
                    "title": getattr(inc, "title", None),
                },
            )

    )



    return points


async def get_incident_clusters(
    db: AsyncSession,
    zoom: int,
    limit: int = 1000,
) -> List[Cluster]:
    points = await get_incident_points(db, limit=limit)
    return cluster_points(points, zoom=zoom)
