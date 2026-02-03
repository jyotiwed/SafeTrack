# app/utils/incident_events.py
import json
from typing import Any
from app.core.redis import redis_client

INCIDENT_CHANNEL = "incidents:public"

def _incident_to_payload(incident: Any) -> dict:
    return {
        "type": "incident.created",
        "id": incident.id,
        "title": incident.title,
        "severity": incident.severity,
        "status": incident.status,
        "reporter_id": incident.reporter_id,
        "latitude": None,
        "longitude": None,
        "created_at": incident.created_at.isoformat(),
    }

async def broadcast_incident_created(incident: Any) -> None:
    if redis_client is None:
        return
    payload = _incident_to_payload(incident)
    try:
        await redis_client.publish(INCIDENT_CHANNEL, json.dumps(payload))
    except Exception:
        return
