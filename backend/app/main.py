from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from .config import settings
from .api.v1.router import api_router
from .utils.cleanup import cleanup_old_files, get_storage_stats


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize scheduler for cleanup
    scheduler.add_job(
        cleanup_old_files,
        'interval',
        hours=1,
        id='cleanup_job'
    )
    scheduler.start()

    # Ensure upload directories exist
    settings.original_dir.mkdir(parents=True, exist_ok=True)
    settings.processed_dir.mkdir(parents=True, exist_ok=True)

    yield

    # Shutdown: Stop scheduler
    scheduler.shutdown()


app = FastAPI(
    title=settings.app_name,
    description="API for automatic image background removal using U2-Net",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/stats")
async def storage_stats():
    return get_storage_stats()
