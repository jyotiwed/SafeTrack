import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.utils.realtime_manager import manager

router = APIRouter(prefix="/realtime", tags=["realtime"])

INCIDENT_CHANNEL = "incidents:public"

redis = Redis(
    host="127.0.0.1",
    port=6379,
    decode_responses=True,
)

@router.websocket("/incidents")
async def incidents_realtime(websocket: WebSocket):
    print("WS: connected")

    # ✅ accept ONLY here
    await websocket.accept()
    manager.connect(websocket)

    pubsub = redis.pubsub()
    await pubsub.subscribe(INCIDENT_CHANNEL)

    async def redis_listener():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await websocket.send_text(msg["data"])

    async def websocket_listener():
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    try:
        await asyncio.gather(redis_listener(), websocket_listener())
    except WebSocketDisconnect:
        print("WS: disconnected")
    finally:
        await pubsub.unsubscribe(INCIDENT_CHANNEL)
        await pubsub.close()
        manager.disconnect(websocket)
@router.post("/test-publish")
async def test_publish():
    payload = {
        "type": "incident.created",
        "title": "Test Incident",
        "severity": "medium",
    }

    await redis.publish(INCIDENT_CHANNEL, json.dumps(payload))
    return {"status": "published"}
