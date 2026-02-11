"""API key authentication middleware."""

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette.requests import Request

from ..models.api_key import TIER_LIMITS, ApiKey
from ..services.api_key_service import api_key_service

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def optional_api_key(
    request: Request,
    api_key: str | None = Security(api_key_header),
) -> ApiKey | None:
    """Validate API key if present. Returns None for web-frontend requests (no key).

    When a key IS provided:
    - Validates it exists and is active
    - Increments daily usage counter (resets daily)
    - Returns 401 if invalid, 429 if over daily quota
    - Attaches key info to request.state.api_key

    When no key is provided:
    - Returns None (IP-based rate limiting still applies via slowapi)
    """
    if not api_key:
        return None

    key_obj = api_key_service.get_key(api_key)
    if not key_obj or not key_obj.is_active:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key.")

    if not api_key_service.increment_usage(api_key):
        raise HTTPException(
            status_code=429,
            detail=f"Daily API quota exceeded ({key_obj.requests_limit} requests). Upgrade your tier for more.",
        )

    request.state.api_key = key_obj
    return key_obj


async def require_api_key(
    request: Request,
    api_key: str | None = Security(api_key_header),
) -> ApiKey:
    """Strictly require a valid API key. Use on endpoints that must be authenticated."""
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API key. Include X-API-Key header.")

    key_obj = await optional_api_key(request, api_key)
    assert key_obj is not None  # optional_api_key raises on invalid key when key is provided
    return key_obj


def check_batch_allowed(api_key: ApiKey | None) -> None:
    """Raise 403 if the key's tier doesn't allow batch uploads.

    If no API key (web frontend), batch is allowed.
    """
    if api_key is None:
        return
    limits = TIER_LIMITS.get(api_key.tier, {})
    if not limits.get("batch_allowed", False):
        raise HTTPException(
            status_code=403,
            detail=f"Batch upload not available on {api_key.tier} tier. Upgrade to Pro or Enterprise.",
        )
