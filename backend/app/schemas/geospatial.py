# app/schemas/geospatial.py
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class MapPoint(BaseModel):
    id: int
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    type: str  
    properties: Dict[str, Any]


class Cluster(BaseModel):
    id: int
    latitude: float
    longitude: float
    count: int
    points: Optional[List[MapPoint]] = None  