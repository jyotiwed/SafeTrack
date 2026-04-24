
import json
import logging
from typing import Any




from app.core import redis as core_redis

INCIDENT_CHANNEL = "incidents:public"

logger = logging.getLogger(__name__)


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
    payload = _incident_to_payload(incident)

    if core_redis.redis_client is None:
        logger.warning("Redis unavailable. Queuing or dropping incident %s", getattr(incident, "id", "<no-id>"))
        return

    try:
        await core_redis.redis_client.publish(INCIDENT_CHANNEL, json.dumps(payload))
        logger.debug("Published incident %s to channel %s", payload.get("id"), INCIDENT_CHANNEL)
    except Exception as e:
        logger.error("Failed to publish incident %s: %s", getattr(incident, "id", "<no-id>"), e, exc_info=True)
        return