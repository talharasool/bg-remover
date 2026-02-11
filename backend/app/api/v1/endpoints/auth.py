"""API key management endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from ....models.api_key import Tier
from ....services.api_key_service import api_key_service

router = APIRouter(prefix="/auth", tags=["auth"])


class GenerateKeyRequest(BaseModel):
    email: EmailStr


class GenerateKeyResponse(BaseModel):
    api_key: str
    tier: str
    requests_limit: int
    message: str


class UsageResponse(BaseModel):
    tier: str
    requests_used: int
    requests_limit: int
    remaining_requests: int
    is_active: bool


class RotateKeyResponse(BaseModel):
    new_api_key: str
    message: str


@router.post("/generate-key", response_model=GenerateKeyResponse)
async def generate_api_key(body: GenerateKeyRequest) -> GenerateKeyResponse:
    """Generate a free-tier API key for the given email."""
    # Check if user already has an active key
    existing = api_key_service.get_keys_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An active API key already exists for this email. Revoke it first or use /rotate-key.",
        )

    key_obj = api_key_service.generate_key(body.email, Tier.FREE)
    return GenerateKeyResponse(
        api_key=key_obj.key,
        tier=key_obj.tier,
        requests_limit=key_obj.requests_limit,
        message="API key generated. Store it securely — it won't be shown again.",
    )


@router.get("/usage")
async def get_usage(api_key: str) -> UsageResponse:
    """Get usage stats for an API key. Pass the key as a query parameter."""
    key_obj = api_key_service.get_key(api_key)
    if not key_obj:
        raise HTTPException(status_code=404, detail="API key not found.")

    return UsageResponse(
        tier=key_obj.tier,
        requests_used=key_obj.requests_used,
        requests_limit=key_obj.requests_limit,
        remaining_requests=key_obj.remaining_requests,
        is_active=key_obj.is_active,
    )


@router.post("/rotate-key", response_model=RotateKeyResponse)
async def rotate_api_key(api_key: str) -> RotateKeyResponse:
    """Rotate an API key: revoke the old one and generate a new one."""
    new_key = api_key_service.rotate_key(api_key)
    if not new_key:
        raise HTTPException(status_code=404, detail="API key not found or already revoked.")

    return RotateKeyResponse(
        new_api_key=new_key.key,
        message="Old key revoked. Store the new key securely.",
    )


@router.delete("/revoke-key")
async def revoke_api_key(api_key: str) -> dict:
    """Permanently revoke an API key."""
    revoked = api_key_service.revoke_key(api_key)
    if not revoked:
        raise HTTPException(status_code=404, detail="API key not found or already revoked.")

    return {"message": "API key revoked successfully."}
