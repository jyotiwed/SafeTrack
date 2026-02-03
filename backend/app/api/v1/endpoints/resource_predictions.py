from fastapi import APIRouter, HTTPException, status

from app.schemas.resource_prediction import (
    ResourceDemandRequest,
    ResourceDemandResponse,
)
from app.services.resource_ml_service import (
    predict_resource_demand,
    ResourceModelNotAvailableError,
)

router = APIRouter(prefix="/resource-predictions", tags=["resource-predictions"])


@router.post(
    "/demand",
    response_model=ResourceDemandResponse,
    status_code=status.HTTP_200_OK,
)
async def get_resource_demand(req: ResourceDemandRequest):
    try:
        return predict_resource_demand(req)
    except ResourceModelNotAvailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
