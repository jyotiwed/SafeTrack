# app/main.py
from contextlib import asynccontextmanager
from typing import List
from fastapi.staticfiles import StaticFiles



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis

from app.api.v1.api_router import api_router
from app.core.config import get_settings
from app.core.redis import init_redis, close_redis
from app.core import redis as core_redis

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()
    
    


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)


@app.get("/debug/redis")
async def debug_redis():
    """Diagnostic endpoint: reports whether redis_client is initialized and can respond to PING."""
    from app.core import redis as core_redis
    info = {"redis_url": str(settings.REDIS_URL), "redis_client_exists": core_redis.redis_client is not None}
    if core_redis.redis_client is not None:
        try:
            pong = await core_redis.redis_client.ping()
            info["ping"] = bool(pong)
        except Exception as e:
            info["ping_error"] = str(e)
    return info

'''@app.get("/debug/config")
async def debug_config():
    return {
        "redis_url": str(settings.REDIS_URL),
        "redis_client_exists": core_redis.redis_client is not None,
        "project_name": settings.PROJECT_NAME
    }
'''

cors_origins_raw = settings.BACKEND_CORS_ORIGINS

origins: List[str] = []

if isinstance(cors_origins_raw, str):
    
    origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
elif isinstance(cors_origins_raw, list):
    
    origins = [str(o) for o in cors_origins_raw]

if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,        
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],    
    )


app.include_router(api_router, prefix="/api/v1")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


