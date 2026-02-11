from fastapi import APIRouter

from .endpoints import auth, downloads, images, jobs

api_router = APIRouter()

api_router.include_router(images.router, tags=["images"])

api_router.include_router(jobs.router, tags=["jobs"])

api_router.include_router(downloads.router, tags=["downloads"])

api_router.include_router(auth.router)
