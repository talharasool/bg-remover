"""Rate limiting middleware using slowapi.

Two layers of rate limiting:
1. IP-based (slowapi) — applies to all requests, prevents abuse from web frontend
2. Tier-based (API key) — daily quota tracked per key in api_key_auth middleware
"""

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse


def _get_rate_limit_key(request: Request) -> str:
    """Use API key as rate limit key if present, otherwise IP address."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"apikey:{api_key}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key, default_limits=["60/minute"])


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom 429 response for rate limit exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": str(exc.detail),
        },
    )
