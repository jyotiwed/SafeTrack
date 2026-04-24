# app/crud/incident_prediction.py
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_

from app.models.incident_prediction import IncidentPrediction
from app.schemas.incident_prediction import (
    IncidentPredictionCreate,
    IncidentPredictionUpdate,
)


async def create_incident_prediction(
    db: AsyncSession, incident_prediction: IncidentPredictionCreate
) -> IncidentPrediction:
    """Create a new incident prediction record"""
    db_incident_pred = IncidentPrediction(
        incident_id=incident_prediction.incident_id,
        risk_score=incident_prediction.risk_score,
        predicted_severity=incident_prediction.predicted_severity,
        estimated_resources_required=incident_prediction.estimated_resources_required,
        estimated_budget=incident_prediction.estimated_budget,
        forecast_date=incident_prediction.forecast_date,
        prediction_horizon_days=incident_prediction.prediction_horizon_days,
        model_version=incident_prediction.model_version,
        ml_pipeline_id=incident_prediction.ml_pipeline_id,
        confidence_level=incident_prediction.confidence_level,
    )
    db.add(db_incident_pred)
    await db.commit()
    await db.refresh(db_incident_pred)
    return db_incident_pred


async def get_incident_prediction(
    db: AsyncSession, incident_prediction_id: int
) -> Optional[IncidentPrediction]:
    """Get a single incident prediction by ID"""
    result = await db.execute(
        select(IncidentPrediction).where(IncidentPrediction.id == incident_prediction_id)
    )
    return result.scalars().first()


async def get_incident_predictions_by_incident(
    db: AsyncSession, incident_id: int, skip: int = 0, limit: int = 10
) -> List[IncidentPrediction]:
    """Get all predictions for a specific incident"""
    result = await db.execute(
        select(IncidentPrediction)
        .where(IncidentPrediction.incident_id == incident_id)
        .order_by(desc(IncidentPrediction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_predictions_by_forecast_date(
    db: AsyncSession, 
    start_date: datetime, 
    end_date: datetime,
    skip: int = 0, 
    limit: int = 10
) -> List[IncidentPrediction]:
    """Get predictions within a date range"""
    result = await db.execute(
        select(IncidentPrediction)
        .where(
            and_(
                IncidentPrediction.forecast_date >= start_date,
                IncidentPrediction.forecast_date <= end_date,
            )
        )
        .order_by(desc(IncidentPrediction.forecast_date))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_high_risk_predictions(
    db: AsyncSession, min_risk_score: int = 7, skip: int = 0, limit: int = 10
) -> List[IncidentPrediction]:
    """Get high-risk predictions (score >= min_risk_score)"""
    result = await db.execute(
        select(IncidentPrediction)
        .where(IncidentPrediction.risk_score >= min_risk_score)
        .order_by(desc(IncidentPrediction.risk_score))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_predictions_by_severity(
    db: AsyncSession, severity: str, skip: int = 0, limit: int = 10
) -> List[IncidentPrediction]:
    """Get predictions by predicted severity level"""
    result = await db.execute(
        select(IncidentPrediction)
        .where(IncidentPrediction.predicted_severity == severity)
        .order_by(desc(IncidentPrediction.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_incident_prediction(
    db: AsyncSession,
    incident_prediction_id: int,
    prediction_update: IncidentPredictionUpdate,
) -> Optional[IncidentPrediction]:
    """Update an incident prediction record"""
    db_pred = await get_incident_prediction(db, incident_prediction_id)
    if not db_pred:
        return None

    update_data = prediction_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pred, key, value)

    db_pred.updated_at = datetime.now(timezone) # type: ignore
    db.add(db_pred)
    await db.commit()
    await db.refresh(db_pred)
    return db_pred


async def delete_incident_prediction(
    db: AsyncSession, incident_prediction_id: int
) -> bool:
    """Delete an incident prediction record"""
    db_pred = await get_incident_prediction(db, incident_prediction_id)
    if not db_pred:
        return False

    await db.delete(db_pred)
    await db.commit()
    return True


async def get_resource_forecast_summary(
    db: AsyncSession, incident_id: int
) -> Optional[dict]:
    """Get aggregate resource forecast data for an incident"""
    predictions = await get_incident_predictions_by_incident(
        db, incident_id, skip=0, limit=100
    )
    if not predictions:
        return None

    total_resources = sum(
        p.estimated_resources_required or 0 for p in predictions
    )
    total_budget = sum(p.estimated_budget or 0.0 for p in predictions)
    avg_risk_score = sum(p.risk_score for p in predictions) / len(predictions)

    return {
        "incident_id": incident_id,
        "total_predictions": len(predictions),
        "total_resources_forecast": total_resources,
        "total_budget_forecast": total_budget,
        "average_risk_score": avg_risk_score,
        "most_severe_prediction": max(p.predicted_severity for p in predictions),
    }

class CRUDIncidentPrediction:
    """CRUD class for IncidentPrediction model"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, obj_in: IncidentPredictionCreate) -> IncidentPrediction:
        """Create a new incident prediction"""
        return await create_incident_prediction(db, obj_in)
    
    async def get(self, db: AsyncSession, id: int) -> Optional[IncidentPrediction]:
        """Get incident prediction by ID"""
        return await get_incident_prediction(db, id)
    
    async def update(self, db: AsyncSession, db_obj: IncidentPrediction, obj_in: IncidentPredictionUpdate) -> Optional[IncidentPrediction]:
        """Update incident prediction"""
        pred_id = db_obj.id if isinstance(db_obj.id, int) else int(str(db_obj.id))
        return await update_incident_prediction(db, pred_id, obj_in)
    
    async def remove(self, db: AsyncSession, id: int) -> bool:
        """Delete incident prediction"""
        return await delete_incident_prediction(db, id)
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 50) -> List[IncidentPrediction]:
        """Get multiple incident predictions"""
        result = await db.execute(select(IncidentPrediction).offset(skip).limit(limit))
        return list(result.scalars().all())