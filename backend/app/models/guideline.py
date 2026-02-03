from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Enum as SQLAEnum,
    Text,
    DateTime,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database.base import Base


class GuidelinePhaseEnum(str, Enum):
    BEFORE = "before"
    DURING = "during"
    AFTER = "after"


class HazardTypeEnum(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    HEATWAVE = "heatwave"
    LANDSLIDE = "landslide"
    GENERIC = "generic"


class Guideline(Base):
    __tablename__ = "guidelines"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", back_populates="guidelines")

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    phase = Column(
        SQLAEnum(GuidelinePhaseEnum, name="guideline_phase"),
        nullable=False,
        index=True,
    )

    hazard_type = Column(
        SQLAEnum(HazardTypeEnum, name="hazard_type"),
        nullable=False,
        index=True,
    )

    # Optional region geometry for location-specific guidelines
    region = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)

    language_code = Column(String(10), nullable=False, default="en", index=True)

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
