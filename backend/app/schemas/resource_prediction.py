from pydantic import BaseModel, Field


class ResourceDemandRequest(BaseModel):
    incident_id: int | None = None
    severity: str
    affected_population: int = Field(ge=0)
    area_km2: float = Field(ge=0)
    features: dict | None = None


class ResourceDemandResponse(BaseModel):
    incident_id: int | None = None
    severity: str
    teams_needed: int
    boats_needed: int
    ambulances_needed: int
