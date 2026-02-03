from enum import Enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    String,
    Enum as SQLAEnum,
    DateTime,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database.base import Base


class IncidentSeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatusEnum(str, Enum):
    NEW = "new"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)

    # Human-readable location/address
    address = Column(String(255), nullable=True)

    severity = Column(
        SQLAEnum(
            IncidentSeverityEnum,
            name="incident_severity",
            native_enum=True,
            validate_strings=True,
        ),
        nullable=False,
        index=True,
    )

    status = Column(
        SQLAEnum(
            IncidentStatusEnum,
            name="incident_status",
            native_enum=True,
            validate_strings=True,
        ),
        nullable=False,
        default=IncidentStatusEnum.NEW,
        index=True,
    )

    # PostGIS geometry POINT (lon, lat) in WGS84
    location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True, index=True)

    # Denormalized numeric columns for mapping/querying
    latitude = Column(Numeric(9, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)

    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reporter = relationship("User", back_populates="incidents")
    tasks = relationship("Task", back_populates="incident", cascade="all, delete-orphan")
    # Add these relationship lines to the Incident class in incident.py


    predictions = relationship(
    "Prediction",
    back_populates="incident",
    cascade="all, delete-orphan",
    lazy="selectin"
)
    incident_predictions = relationship(
    "IncidentPrediction",
    back_populates="incident",
    cascade="all, delete-orphan",
    lazy="selectin"
)
    
    
    
    media_urls = Column(ARRAY(String), nullable=True)

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
