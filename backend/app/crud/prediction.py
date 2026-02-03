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
