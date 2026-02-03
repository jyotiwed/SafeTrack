# app/models/incident_prediction.py
from enum import Enum
from datetime import datetime, timezone, timedelta

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    CheckConstraint,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class IncidentPrediction(Base):
    __tablename__ = "incident_predictions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    
    # Risk scoring (1-10 scale)
    risk_score = Column(Integer, nullable=False)  # 1 to 10
    
    # Severity prediction
    predicted_severity = Column(String(50), nullable=False)  # "low", "moderate", "high", "critical"
    
    # Resource demand forecast
    estimated_resources_required = Column(Integer, nullable=True)  # Number of personnel
    estimated_budget = Column(Float, nullable=True)  # Budget in INR
    
    # Forecast timeline
    forecast_date = Column(DateTime(timezone=True), nullable=False, index=True)
    prediction_horizon_days = Column(Integer, default=7)  # 7-day, 30-day forecasts
    
    # Model info
    model_version = Column(String(50), nullable=True)
    ml_pipeline_id = Column(String(100), nullable=True)  # Track which pipeline generated this
    
    # Confidence and metadata
    confidence_level = Column(Float, nullable=True)  # 0.0 to 1.0
    additional_metadata = Column(JSON, nullable=True)  # Store extra prediction data
    
    # Audit trail
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # Constraints
    __table_args__ = (
        CheckConstraint("risk_score >= 1 AND risk_score <= 10", name="check_risk_score_range"),
        CheckConstraint("confidence_level >= 0.0 AND confidence_level <= 1.0", name="check_confidence_range"),
    )

    # Relationships
    incident = relationship("Incident", back_populates="incident_predictions")