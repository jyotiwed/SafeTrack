# app/core/redis.py
from typing import Optional
import redis.asyncio as redis

redis_client: Optional[redis.Redis] = None


async def init_redis() -> None:
    global redis_client
    from app.core.config import get_settings  # Import here instead
    settings = get_settings()
    
    print(f"🔧 Initializing Redis with URL: {settings.REDIS_URL}")
    try:
        if redis_client is None:
            redis_client = redis.from_url(
                str(settings.REDIS_URL),
                encoding="utf-8",
                decode_responses=True,
            )
            # Test the connection
            await redis_client.ping()
            print("✅ Redis connected successfully!")
            print(f"✅ redis_client is now: {redis_client}")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        redis_client = None


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
        print("✅ Redis closed")