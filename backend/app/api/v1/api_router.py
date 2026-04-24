# app/api/v1/api_router.py
from fastapi import APIRouter


from app.api.v1.endpoints import (
    auth,
    users,
    incidents,
    tasks,
    geospatial,
    predictions,
    incident_predictions,
    realtime, 
    analytics,
    preparedness,
    emergency,
    resource_predictions
    
    
)

api_router = APIRouter()


api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(incidents.router)
api_router.include_router(resource_predictions.router)



api_router.include_router(tasks.router)
api_router.include_router(geospatial.router)
api_router.include_router(predictions.router)
api_router.include_router(incident_predictions.router)
api_router.include_router(realtime.router)


api_router.include_router(analytics.router)
api_router.include_router(preparedness.router)
api_router.include_router(emergency.router)


