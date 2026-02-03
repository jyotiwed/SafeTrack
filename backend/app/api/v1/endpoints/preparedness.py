from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_db,
    require_admin_or_official,
    get_current_user,
)
from app.models.guideline import GuidelinePhaseEnum, HazardTypeEnum
from app.models.user import User as UserModel
from app.schemas.preparedness import (
    GuidelineCreate,
    GuidelineUpdate,
    GuidelineRead,
    PersonalizationRequest,
    PersonalisedGuideline,
    GuidelinePhase,
    HazardType,
)
from app.services.preparedness_service import (
    create_guideline as service_create_guideline,
    get_guideline as service_get_guideline,
    list_guidelines as service_list_guidelines,
    personalize_guidelines as service_personalize_guidelines,
    GuidelineNotFoundError,
)

router = APIRouter(prefix="/preparedness", tags=["preparedness"])


@router.post(
    "/guidelines",
    response_model=GuidelineRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_or_official())],
)
async def create_guideline(
    guideline_in: GuidelineCreate,
    db: AsyncSession = Depends(get_db),
):
    guideline = await service_create_guideline(db, guideline_in)
    return guideline


@router.get(
    "/guidelines",
    response_model=List[GuidelineRead],
)
async def list_guidelines(
    db: AsyncSession = Depends(get_db),
    phase: Optional[GuidelinePhase] = Query(default=None),
    hazard_type: Optional[HazardType] = Query(default=None),
    language_code: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    phase_enum: Optional[GuidelinePhaseEnum] = (
        GuidelinePhaseEnum(phase.value) if phase is not None else None
    )
    hazard_enum: Optional[HazardTypeEnum] = (
        HazardTypeEnum(hazard_type.value) if hazard_type is not None else None
    )

    guidelines = await service_list_guidelines(
        db=db,
        phase=phase_enum,
        hazard_type=hazard_enum,
        language_code=language_code,
        limit=limit,
        offset=offset,
    )
    return guidelines


@router.get(
    "/guidelines/{guideline_id}",
    response_model=GuidelineRead,
)
async def get_guideline(
    guideline_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        guideline = await service_get_guideline(db, guideline_id)
        return guideline
    except GuidelineNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/personalized",
    response_model=List[PersonalisedGuideline],
)
async def get_personalized_guidelines(
    req: PersonalizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # current_user reserved for future personalization based on role, history, etc.
    return await service_personalize_guidelines(db, req)

