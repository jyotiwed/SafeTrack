from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.schemas.geospatial import MapPoint, Cluster
from app.services.geospatial_service import (
    get_incident_points,
    get_incident_clusters,
)

router = APIRouter(prefix="/geospatial", tags=["geospatial"])


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
