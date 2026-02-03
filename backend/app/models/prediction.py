# app/models/prediction.py
from enum import Enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Enum as SQLAEnum,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class RiskTypeEnum(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    LANDSLIDE = "landslide"
    WILDFIRE = "wildfire"


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)

    risk_type = Column(
        SQLAEnum(
            RiskTypeEnum,
            name="risk_type",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        index=True,
    )

    probability = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=True)

    model_version = Column(String(50), nullable=True)
    algorithm = Column(String(100), nullable=True)

    features_used = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    incident = relationship("Incident", back_populates="predictions")
