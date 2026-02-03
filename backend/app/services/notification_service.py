
import json
from typing import Any

from app.core.redis import redis_client

INCIDENT_CHANNEL = "incidents:public"


def _incident_to_payload(incident: Any) -> dict:
    # Extract lat/lon from geometry if needed
    latitude = None
    longitude = None
    if getattr(incident, "location", None) is not None:
        try:
            # Using PostGIS functions on the DB side is better, but for now assume you store lat/lon separately or add them later.
            pass
        except Exception:
            pass

    return {
        "type": "incident.created",
        "id": incident.id,
        "title": incident.title,
        "severity": incident.severity,
        "status": incident.status,
        "reporter_id": incident.reporter_id,
        "latitude": latitude,
        "longitude": longitude,
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
    
    