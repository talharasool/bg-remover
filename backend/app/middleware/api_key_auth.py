"""API key authentication middleware."""

from fastapi import HTTPException, Request, Security
from fastapi.security import APIKeyHeader

from ..models.api_key import TIER_LIMITS, ApiKey
from ..services.api_key_service import api_key_service

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(
    request: Request,
    api_key: str | None = Security(api_key_header),
) -> ApiKey:
    """Validate API key and check usage limits.

    Use as a FastAPI dependency on protected endpoints.
    """
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key. Include X-API-Key header.")

    key_obj = api_key_service.get_key(api_key)
    if not key_obj or not key_obj.is_active:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key.")

    if not api_key_service.increment_usage(api_key):
        raise HTTPException(
            status_code=429,
            detail=f"Daily API quota exceeded ({key_obj.requests_limit} requests). Upgrade your tier for more.",
        )

    # Attach key info to request state for downstream use
    request.state.api_key = key_obj
    return key_obj


def check_batch_allowed(api_key: ApiKey) -> None:
    """Raise 403 if the key's tier doesn't allow batch uploads."""
    limits = TIER_LIMITS.get(api_key.tier, {})
    if not limits.get("batch_allowed", False):
        raise HTTPException(
            status_code=403,
            detail=f"Batch upload not available on {api_key.tier} tier. Upgrade to Pro or Enterprise.",
        )
