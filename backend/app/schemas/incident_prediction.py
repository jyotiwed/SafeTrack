# app/schemas/incident_prediction.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class IncidentPredictionBase(BaseModel):
    risk_score: int = Field(ge=1, le=10)
    predicted_severity: str
    estimated_resources_required: Optional[int] = None
    estimated_budget: Optional[float] = None
    forecast_date: datetime
    prediction_horizon_days: int = 7
    confidence_level: Optional[float] = Field(None, ge=0.0, le=1.0)


class IncidentPredictionCreate(IncidentPredictionBase):
    incident_id: int
    model_version: Optional[str] = None
    ml_pipeline_id: Optional[str] = None


class IncidentPredictionUpdate(BaseModel):
    risk_score: Optional[int] = Field(None, ge=1, le=10)
    predicted_severity: Optional[str] = None
    estimated_resources_required: Optional[int] = None
    estimated_budget: Optional[float] = None
    confidence_level: Optional[float] = Field(None, ge=0.0, le=1.0)


class IncidentPredictionRead(IncidentPredictionBase):
    id: int
    incident_id: int
    model_version: Optional[str] = None
    ml_pipeline_id: Optional[str] = None
    additional_metadata: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True