import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core import redis as core_redis
from app.utils.realtime_manager import manager

router = APIRouter(prefix="/realtime", tags=["realtime"])

INCIDENT_CHANNEL = "incidents:public"
logger = logging.getLogger(__name__)

@router.websocket("/incidents")
async def incidents_realtime(websocket: WebSocket):
    await websocket.accept()
    manager.connect(websocket)
    logger.info("WebSocket connected")
    
    await websocket.send_json({
        "type": "connected",
        "message": "welcome"
    })

    if core_redis.redis_client is None:
        await websocket.send_json({
            "type": "error",
            "message": "Realtime temporarily unavailable"
        })
        await websocket.close(code=1011)
        manager.disconnect(websocket)
        return

    pubsub = core_redis.redis_client.pubsub()
    await pubsub.subscribe(INCIDENT_CHANNEL)

    async def redis_listener():
        try:
            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message is None:
                    await asyncio.sleep(0.01)
                    continue

                raw = message.get("data")

                if not raw:
                    continue

                # decode_responses=True already gives str
                try:
                    json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON from Redis: %s", raw)
                    continue

                logger.info(f"📩 Forwarding Redis message: {raw}")

                try:
                    await websocket.send_text(raw)
                except Exception:
                    logger.info("WebSocket send failed — client disconnected")
                    break

        except asyncio.CancelledError:
            logger.debug("Redis listener cancelled")
        except Exception as e:
            logger.error("Redis listener error: %s", e)

    # ----------------------------
    # WEBSOCKET LISTENER (Ping/Pong)
    # ----------------------------
    async def websocket_listener():
        try:
            while True:
                msg = await websocket.receive_text()

                try:
                    data = json.loads(msg)
                except json.JSONDecodeError:
                    continue

                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            logger.info("Client disconnected")
        except asyncio.CancelledError:
            logger.debug("WebSocket listener cancelled")
        except Exception as e:
            logger.debug("WebSocket listener error: %s", e)

    # ----------------------------
    # RUN BOTH TASKS SAFELY
    # ----------------------------
    redis_task = asyncio.create_task(redis_listener())
    ws_task = asyncio.create_task(websocket_listener())

    try:
        done, pending = await asyncio.wait(
            [redis_task, ws_task],
            return_when=asyncio.FIRST_COMPLETED
        )
    finally:
        # Cancel remaining tasks
        for task in pending: # type: ignore
            task.cancel()

        # Cleanup Redis
        try:
            await pubsub.unsubscribe(INCIDENT_CHANNEL)
            await pubsub.close()
        except Exception:
            pass

        manager.disconnect(websocket)
        logger.info("WebSocket cleanup complete")
