# app/api/v1/endpoints/predictions.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.crud import prediction as crud_prediction
from app.models.user import User
from app.schemas.prediction import (
    PredictionCreate,
    PredictionRead,
    PredictionUpdate,
)

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/", response_model=PredictionRead, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    prediction: PredictionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new prediction record for an incident.
    
    - **incident_id**: The incident this prediction is for
    - **risk_type**: Type of risk (flood, cyclone, earthquake, landslide, wildfire)
    - **probability**: ML model confidence (0.0 to 1.0)
    - **confidence_score**: Optional additional confidence metric
    - **model_version**: Version of the ML model used
    - **algorithm**: Algorithm name (RandomForest, GradientBoosting, etc.)
    """
    try:
        db_prediction = await crud_prediction.create_prediction(db, prediction)
        return db_prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{prediction_id}", response_model=PredictionRead)
async def get_prediction(
    prediction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific prediction by ID"""
    db_prediction = await crud_prediction.get_prediction(db, prediction_id)
    if not db_prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    return db_prediction


@router.get("/incident/{incident_id}", response_model=List[PredictionRead])
async def get_predictions_by_incident(
    incident_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all predictions for a specific incident"""
    predictions = await crud_prediction.get_predictions_by_incident(
        db, incident_id, skip=skip, limit=limit
    )
    return predictions


@router.get("/risk-type/{risk_type}", response_model=List[PredictionRead])
async def get_predictions_by_risk_type(
    risk_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all predictions for a specific risk type (flood, cyclone, earthquake, etc.)"""
    predictions = await crud_prediction.get_predictions_by_risk_type(
        db, risk_type, skip=skip, limit=limit
    )
    return predictions


@router.get("/confidence/high", response_model=List[PredictionRead])
async def get_high_confidence_predictions(
    min_confidence: float = Query(0.8, ge=0.0, le=1.0),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get predictions with confidence score above threshold"""
    predictions = await crud_prediction.get_high_confidence_predictions(
        db, min_confidence=min_confidence, skip=skip, limit=limit
    )
    return predictions


@router.put("/{prediction_id}", response_model=PredictionRead)
async def update_prediction(
    prediction_id: int,
    prediction_update: PredictionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a prediction record"""
    db_prediction = await crud_prediction.update_prediction(
        db, prediction_id, prediction_update
    )
    if not db_prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    return db_prediction


@router.delete("/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prediction(
    prediction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a prediction record"""
    success = await crud_prediction.delete_prediction(db, prediction_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )
    return None