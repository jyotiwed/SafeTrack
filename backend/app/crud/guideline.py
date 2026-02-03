from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.guideline import Guideline, GuidelinePhaseEnum, HazardTypeEnum
from app.schemas.preparedness import GuidelineCreate, GuidelineUpdate
from collections.abc import Sequence
from typing import Optional

async def get_guideline_by_id(
    db: AsyncSession,
    guideline_id: int,
) -> Optional[Guideline]:
    result = await db.execute(select(Guideline).where(Guideline.id == guideline_id))
    return result.scalars().first()


async def list_guidelines(
    db: AsyncSession,
    phase: Optional[GuidelinePhaseEnum] = None,
    hazard_type: Optional[HazardTypeEnum] = None,
    language_code: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Guideline]:
    stmt = select(Guideline).order_by(Guideline.created_at.desc()).limit(limit).offset(offset)
    if phase is not None:
        stmt = stmt.where(Guideline.phase == phase)
    if hazard_type is not None:
        stmt = stmt.where(Guideline.hazard_type == hazard_type)
    if language_code is not None:
        stmt = stmt.where(Guideline.language_code == language_code)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_guideline(
    db: AsyncSession,
    guideline_in: GuidelineCreate,
) -> Guideline:
    db_obj = Guideline(
        title=guideline_in.title,
        content=guideline_in.content,
        phase=GuidelinePhaseEnum(guideline_in.phase.value),
        hazard_type=HazardTypeEnum(guideline_in.hazard_type.value),
        language_code=guideline_in.language_code,
        # region can be set later if you convert bbox to polygon
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_guideline(
    db: AsyncSession,
    db_obj: Guideline,
    guideline_in: GuidelineUpdate,
) -> Guideline:
    if guideline_in.title is not None:
        db_obj.title = guideline_in.title # type: ignore
    if guideline_in.content is not None:
        db_obj.content = guideline_in.content # type: ignore
    if guideline_in.phase is not None:
        db_obj.phase = GuidelinePhaseEnum(guideline_in.phase.value) # type: ignore
    if guideline_in.hazard_type is not None:
        db_obj.hazard_type = HazardTypeEnum(guideline_in.hazard_type.value) # type: ignore
    if guideline_in.language_code is not None:
        db_obj.language_code = guideline_in.language_code # type: ignore

    await db.commit()
    await db.refresh(db_obj)
    return db_obj

