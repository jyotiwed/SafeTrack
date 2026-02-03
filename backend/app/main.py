# app/main.py
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis

from app.api.v1.api_router import api_router
from app.core.config import get_settings
from app.core.redis import init_redis, close_redis
from app.core.redis import redis_client

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

'''@app.get("/debug/config")
async def debug_config():
    return {
        "redis_url": str(settings.REDIS_URL),
        "redis_client_exists": redis_client is not None,
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


