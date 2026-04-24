# app/crud/prediction.py
from datetime import datetime
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate, PredictionUpdate


async def create_prediction(
    db: AsyncSession, prediction: PredictionCreate
) -> Prediction:
    """Create a new prediction record"""

    db_prediction = Prediction(
        incident_id=prediction.incident_id,
        risk_type=prediction.risk_type,
        probability=prediction.probability,
        confidence_score=prediction.confidence_score,
        model_version=prediction.model_version,
        algorithm=prediction.algorithm,
    )

    db.add(db_prediction)
    await db.commit()
    await db.refresh(db_prediction)
    return db_prediction



async def get_prediction(db: AsyncSession, prediction_id: int) -> Optional[Prediction]:
    result = await db.execute(
        select(Prediction).where(Prediction.id == prediction_id)
    )
    return result.scalars().first()


async def get_predictions_by_incident(
    db: AsyncSession, incident_id: int, skip: int = 0, limit: int = 10
) -> List[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.incident_id == incident_id)
        .order_by(desc(Prediction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_predictions_by_risk_type(
    db: AsyncSession, risk_type: str, skip: int = 0, limit: int = 10
) -> List[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.risk_type == risk_type)
        .order_by(desc(Prediction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_high_confidence_predictions(
    db: AsyncSession, min_confidence: float = 0.8, skip: int = 0, limit: int = 10
) -> List[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.confidence_score >= min_confidence)
        .order_by(desc(Prediction.confidence_score))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_prediction(
    db: AsyncSession, prediction_id: int, prediction_update: PredictionUpdate
) -> Optional[Prediction]:
    db_prediction = await get_prediction(db, prediction_id)
    if not db_prediction:
        return None

    update_data = prediction_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prediction, key, value)

    db_prediction.updated_at = datetime.utcnow()  # type: ignore
    db.add(db_prediction)
    await db.commit()
    await db.refresh(db_prediction)
    return db_prediction


async def delete_prediction(db: AsyncSession, prediction_id: int) -> bool:
    db_prediction = await get_prediction(db, prediction_id)
    if not db_prediction:
        return False

    await db.delete(db_prediction)
    await db.commit()
    return True


async def count_predictions_by_incident(
    db: AsyncSession, incident_id: int
) -> int:
    result = await db.execute(
        select(Prediction).where(Prediction.incident_id == incident_id)
    )
    return len(result.scalars().all())

class CRUDPrediction:
    """CRUD class for Prediction model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: PredictionCreate) -> Prediction:
        """Create a new prediction"""
        return await create_prediction(db, obj_in)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[Prediction]:
        """Get prediction by ID"""
        return await get_prediction(db, id)
    
    async def update(self, db: AsyncSession, db_obj: Prediction, obj_in: PredictionUpdate) -> Optional[Prediction]:
        """Update prediction"""
        pred_id = db_obj.id if isinstance(db_obj.id, int) else int(str(db_obj.id))
        return await update_prediction(db, pred_id, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> bool:
        """Delete prediction"""
        return await delete_prediction(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Prediction]:
        """Get multiple predictions"""
        result = await db.execute(select(Prediction).offset(skip).limit(limit))
        return list(result.scalars().all())

