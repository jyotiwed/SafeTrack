# app/schemas/prediction.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.prediction import RiskTypeEnum


class PredictionBase(BaseModel):
    risk_type: RiskTypeEnum
    probability: float = Field(ge=0.0, le=1.0)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    model_version: Optional[str] = None
    algorithm: Optional[str] = None

    @field_validator("risk_type", mode="before")
    @classmethod
    def normalize_risk_type(cls, v):
        # accept case-insensitive strings like "FLOOD", "flood", "Flood"
        if isinstance(v, str):
            return RiskTypeEnum(v.lower())
        return v


class PredictionCreate(PredictionBase):
    incident_id: int


class PredictionUpdate(BaseModel):
    probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class PredictionRead(PredictionBase):
    id: int
    incident_id: int
    features_used: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
