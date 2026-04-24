from typing import List
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

# geospatial_service.py
from typing import Tuple, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
import math

class GeospatialService:
    """
    Simple geospatial helpers. Doesn't depend on a specific GIS library.
    """

    def __init__(self, db: AsyncSession = None): # type: ignore
        self.db = db

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # return meters
        R = 6371000.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    async def points_within_radius(self, points: Sequence[Tuple[float, float]], center: Tuple[float, float], radius_m: float):
        cx, cy = center
        return [p for p in points if self.haversine_distance(cx, cy, p[0], p[1]) <= radius_m]