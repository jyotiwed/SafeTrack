import asyncio
import redis.asyncio as redis

async def t():
    r = redis.Redis.from_url(
        "redis://localhost:6379/0",
        decode_responses=True
    )
    try:
        print(await r.ping())
    except Exception as e:
        print("ERROR", e)
    finally:
        await r.close()

asyncio.run(t())
