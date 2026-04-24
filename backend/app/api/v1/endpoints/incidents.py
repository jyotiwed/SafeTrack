from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.incident_service import (
    create_incident as service_create_incident,
    list_incidents as service_list_incidents,
    get_incident as service_get_incident,
    update_incident as service_update_incident,
    list_incidents_near,
    IncidentNotFoundError,
)

from app.core.dependencies import (
    get_db,
    get_current_user,
    require_operational_roles,
)

from app.models.incident import IncidentStatusEnum
from app.models.user import User as UserModel
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentRead,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


# =========================
# CREATE INCIDENT
# =========================
@router.post(
    "",
    response_model=IncidentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident(
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    incident = await service_create_incident(
        db=db,
        incident_in=incident_in,
        reporter_id=current_user.id,  # type: ignore
    )
    return incident


# =========================
# LIST INCIDENTS
# =========================
@router.get(
    "",
    response_model=List[IncidentRead],
    dependencies=[Depends(require_operational_roles())],
)
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    status: Optional[IncidentStatusEnum] = Query(default=None),
):
    incidents = await service_list_incidents(
        db=db,
        limit=limit,
        offset=offset,
        status=status,
    )
    return incidents


# =========================
# LIST NEARBY INCIDENTS
# ⚠ MUST BE BEFORE /{incident_id}
# =========================
@router.get(
    "/nearby",
    response_model=List[IncidentRead],
)
async def list_nearby_incidents(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_meters: int = Query(5000, gt=0, le=50000),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    incidents = await list_incidents_near(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        limit=limit,
        offset=offset,
    )
    return incidents


# =========================
# GET INCIDENT BY ID
# =========================
@router.get(
    "/{incident_id}",
    response_model=IncidentRead,
    dependencies=[Depends(require_operational_roles())],
)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        incident = await service_get_incident(db, incident_id)
    except IncidentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    return incident



@router.patch(
    "/{incident_id}",
    response_model=IncidentRead,
    dependencies=[Depends(require_operational_roles())],
)
async def update_incident(
    incident_id: int,
    incident_in: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        incident = await service_update_incident(db, incident_id, incident_in)
    except IncidentNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    return incident
