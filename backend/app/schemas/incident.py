# app/schemas/incident.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field



class IncidentBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str
    address: Optional[str] = Field(None, max_length=255)
    severity: str  # "low", "medium", "high", "critical"
    status: str = "new"  # "new", "verified", "in_progress", "resolved", "closed"
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    media_urls: Optional[List[str]] = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = Field(None, max_length=255)
    severity: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    media_urls: Optional[List[str]] = None


class IncidentRead(IncidentBase):
    id: int
    reporter_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
        