
from typing import List, Optional, cast
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.guideline import (
    get_guideline_by_id as crud_get_guideline_by_id,
    list_guidelines as crud_list_guidelines,
    create_guideline as crud_create_guideline,
    update_guideline as crud_update_guideline,
)
from app.models.guideline import Guideline, GuidelinePhaseEnum, HazardTypeEnum
from app.schemas.preparedness import (
    GuidelineCreate,
    GuidelineUpdate,
    PersonalizationRequest,
    PersonalisedGuideline,
)


class GuidelineNotFoundError(Exception):
    pass


async def create_guideline(
    db: AsyncSession,
    guideline_in: GuidelineCreate,
) -> Guideline:
    return await crud_create_guideline(db, guideline_in)


async def get_guideline(
    db: AsyncSession,
    guideline_id: int,
) -> Guideline:
    guideline = await crud_get_guideline_by_id(db, guideline_id)
    if not guideline:
        raise GuidelineNotFoundError("Guideline not found")
    return guideline



async def list_guidelines(
    db: AsyncSession,
    phase: Optional[GuidelinePhaseEnum] = None,
    hazard_type: Optional[HazardTypeEnum] = None,
    language_code: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Guideline]:
    return await crud_list_guidelines(
        db=db,
        phase=phase,
        hazard_type=hazard_type,
        language_code=language_code,
        limit=limit,
        offset=offset,
    )


from typing import List, Optional, cast
from datetime import datetime

# ...

async def personalize_guidelines(
    db: AsyncSession,
    req: PersonalizationRequest,
) -> List[PersonalisedGuideline]:
    guidelines = await crud_list_guidelines(
        db=db,
        phase=GuidelinePhaseEnum(req.phase.value),
        hazard_type=HazardTypeEnum(req.hazard_type.value),
        language_code=req.language_code,
        limit=100,
        offset=0,
    )

    personalised: List[PersonalisedGuideline] = [
        PersonalisedGuideline(
            id=cast(int, g.id),
            title=cast(str, g.title),
            content=cast(str, g.content),
            phase=req.phase,
            hazard_type=req.hazard_type,
            language_code=cast(str, g.language_code),
            created_at=cast(datetime, g.created_at),
            updated_at=cast(datetime, g.updated_at),
            match_score=1.0,
        )
        for g in guidelines
    ]
    return personalised
