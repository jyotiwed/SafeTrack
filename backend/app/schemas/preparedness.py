from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GuidelinePhase(str, Enum):
    BEFORE = "before"
    DURING = "during"
    AFTER = "after"


class HazardType(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    HEATWAVE = "heatwave"
    LANDSLIDE = "landslide"
    GENERIC = "generic"


class GuidelineBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=20)
    phase: GuidelinePhase
    hazard_type: HazardType
    language_code: str = Field(default="en", max_length=10)


class GuidelineCreate(GuidelineBase):
    author_id: int  
    min_latitude: float | None = None
    min_longitude: float | None = None
    max_latitude: float | None = None
    max_longitude: float | None = None
    


class GuidelineUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    content: Optional[str] = Field(default=None, min_length=20)
    phase: Optional[GuidelinePhase] = None
    hazard_type: Optional[HazardType] = None
    language_code: Optional[str] = Field(default=None, max_length=10)


class GuidelineRead(GuidelineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PersonalizationRequest(BaseModel):
    latitude: float
    longitude: float
    hazard_type: HazardType
    phase: GuidelinePhase = GuidelinePhase.BEFORE
    language_code: str = "en"
    radius_meters: float = 50000 


class PersonalisedGuideline(GuidelineRead):
    match_score: float = 1.0
