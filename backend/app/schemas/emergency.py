from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EmergencyContactBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=5, max_length=20)
    relationship: Optional[str] = Field(default=None, max_length=50)


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactRead(EmergencyContactBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EmergencyTriggerRequest(BaseModel):
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    message: str = Field(min_length=3, max_length=500)
