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
        author_id=guideline_in.author_id,
        title=guideline_in.title,
        content=guideline_in.content,
        phase=GuidelinePhaseEnum(guideline_in.phase.value),
        hazard_type=HazardTypeEnum(guideline_in.hazard_type.value),
        language_code=guideline_in.language_code, # type: ignore
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

async def delete_guideline(db: AsyncSession, guideline_id: int) -> None:
    guideline = await get_guideline_by_id(db, guideline_id)
    if guideline:
        await db.delete(guideline)
        await db.commit()


class CRUDGuideline:
    """CRUD class for Guideline model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: GuidelineCreate) -> Guideline:
        """Create a new guideline"""
        return await create_guideline(db, obj_in)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[Guideline]:
        """Get guideline by ID"""
        return await get_guideline_by_id(db, id)
    
    async def update(self, db: AsyncSession, db_obj: Guideline, obj_in: GuidelineUpdate) -> Guideline:
        """Update guideline"""
        return await update_guideline(db, db_obj, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> None:
        """Delete guideline"""
        return await delete_guideline(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Guideline]:
        """Get multiple guidelines"""
        return await list_guidelines(db, limit=limit, offset=skip)

