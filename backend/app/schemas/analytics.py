from datetime import datetime
from typing import List

from pydantic import BaseModel


class TimeBucketCount(BaseModel):
    period_start: datetime
    count: int


class IncidentStatsResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    closed_incidents: int
    by_severity: dict  # {"low": 10, "medium": 5, "high": 2}
    by_type: dict      # {"flood": 8, "fire": 3, ...}


class TaskStatsResponse(BaseModel):
    total_tasks: int
    open_tasks: int
    completed_tasks: int


class IncidentTimelineResponse(BaseModel):
    buckets: List[TimeBucketCount]
