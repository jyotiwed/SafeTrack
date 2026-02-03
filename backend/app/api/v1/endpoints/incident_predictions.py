# app/api/v1/endpoints/incident_predictions.py
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.crud import incident_prediction as crud_incident_pred
from app.models.user import User
from app.schemas.incident_prediction import (
    IncidentPredictionCreate,
    IncidentPredictionRead,
    IncidentPredictionUpdate,
)

router = APIRouter(prefix="/incident-predictions", tags=["incident-predictions"])


@router.post("/", response_model=IncidentPredictionRead, status_code=status.HTTP_201_CREATED)
async def create_incident_prediction(
    incident_prediction: IncidentPredictionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new incident prediction with risk scoring and resource forecast.
    
    - **incident_id**: The incident this prediction is for
    - **risk_score**: Risk score on 1-10 scale
    - **predicted_severity**: Predicted severity level (low, moderate, high, critical)
    - **estimated_resources_required**: Number of personnel needed
    - **estimated_budget**: Budget estimate in INR
    - **forecast_date**: When the forecast is for
    - **prediction_horizon_days**: Forecast window (7, 14, 30 days)
    - **confidence_level**: ML model confidence (0.0 to 1.0)
    """
    try:
        db_incident_pred = await crud_incident_pred.create_incident_prediction(
            db, incident_prediction
        )
        return db_incident_pred
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{incident_prediction_id}", response_model=IncidentPredictionRead)
async def get_incident_prediction(
    incident_prediction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific incident prediction by ID"""
    db_pred = await crud_incident_pred.get_incident_prediction(
        db, incident_prediction_id
    )
    if not db_pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident prediction not found",
        )
    return db_pred


@router.get("/by-incident/{incident_id}", response_model=List[IncidentPredictionRead])
async def get_predictions_by_incident(
    incident_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all predictions for a specific incident"""
    predictions = await crud_incident_pred.get_incident_predictions_by_incident(
        db, incident_id, skip=skip, limit=limit
    )
    return predictions


@router.get("/by-date-range", response_model=List[IncidentPredictionRead])
async def get_predictions_by_date_range(
    start_date: datetime = Query(..., description="Start date for forecast"),
    end_date: datetime = Query(..., description="End date for forecast"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get predictions within a specific date range"""
    predictions = await crud_incident_pred.get_predictions_by_forecast_date(
        db, start_date, end_date, skip=skip, limit=limit
    )
    return predictions


@router.get("/high-risk", response_model=List[IncidentPredictionRead])
async def get_high_risk_predictions(
    min_risk_score: int = Query(7, ge=1, le=10),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get high-risk predictions (score >= min_risk_score)"""
    predictions = await crud_incident_pred.get_high_risk_predictions(
        db, min_risk_score=min_risk_score, skip=skip, limit=limit
    )
    return predictions


@router.get("/by-severity/{severity}", response_model=List[IncidentPredictionRead])
async def get_predictions_by_severity(
    severity: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get predictions by predicted severity level"""
    predictions = await crud_incident_pred.get_predictions_by_severity(
        db, severity, skip=skip, limit=limit
    )
    return predictions


@router.put("/{incident_prediction_id}", response_model=IncidentPredictionRead)
async def update_incident_prediction(
    incident_prediction_id: int,
    prediction_update: IncidentPredictionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an incident prediction record"""
    db_pred = await crud_incident_pred.update_incident_prediction(
        db, incident_prediction_id, prediction_update
    )
    if not db_pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident prediction not found",
        )
    return db_pred


@router.delete("/{incident_prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident_prediction(
    incident_prediction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an incident prediction record"""
    success = await crud_incident_pred.delete_incident_prediction(
        db, incident_prediction_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident prediction not found",
        )
    return None


@router.get("/forecast/summary/{incident_id}", response_model=dict)
async def get_resource_forecast_summary(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get aggregate resource forecast summary for an incident.
    Returns total resources, budget, and average risk score.
    """
    summary = await crud_incident_pred.get_resource_forecast_summary(db, incident_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No predictions found for this incident",
        )
    return summary