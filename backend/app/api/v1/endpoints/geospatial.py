from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.incident import Incident

from app.core.dependencies import get_db, get_current_user
from app.schemas.geospatial import MapPoint, Cluster
from app.services.geospatial_service import (
    get_incident_points,
    get_incident_clusters,
)

router = APIRouter(prefix="/geospatial", tags=["Geospatial"])


@router.get(
    "/incidents/points",
    response_model=List[MapPoint],
)
async def list_incident_points(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    limit: int = Query(default=1000, ge=1, le=5000),
):
    return await get_incident_points(db, limit=limit)


@router.get(
    "/incidents/clusters",
    response_model=List[Cluster],
)
async def list_incident_clusters(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
    zoom: int = Query(default=10, ge=1, le=18),
    limit: int = Query(default=2000, ge=1, le=10000),
):
    return await get_incident_clusters(db, zoom=zoom, limit=limit)

from sqlalchemy import select, func
from geoalchemy2.elements import WKTElement
from app.models.incident import Incident


async def get_incidents_within_radius(
    db,
    latitude: float,
    longitude: float,
    radius_meters: int,
    limit: int,
    offset: int,
):
    # Create reference point (geometry)
    ref_point = WKTElement(
        f"POINT({longitude} {latitude})",
        srid=4326
    )

    stmt = (
        select(Incident)
        .where(
            func.ST_DWithin(
                func.ST_Transform(Incident.location, 4326),
                ref_point,
                radius_meters / 111320.0  
            )
        )
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/bbox")
async def get_incidents_bbox(
    north: float = Query(...),
    south: float = Query(...),
    east: float = Query(...),
    west: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    envelope = func.ST_MakeEnvelope(west, south, east, north, 4326)

    query = (
        select(Incident)
        .where(func.ST_Within(Incident.location, envelope))
    )

    result = await db.execute(query)
    incidents = result.scalars().all()

    return [
        {
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
        }
        for inc in incidents
    ]
    
