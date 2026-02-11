"""API key model and tier definitions."""

from dataclasses import dataclass
from enum import StrEnum


class Tier(StrEnum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Tier limits: (daily_request_limit, max_file_size_mb, batch_allowed)
TIER_LIMITS: dict[str, dict] = {
    Tier.FREE: {"requests_limit": 50, "max_file_size_mb": 5, "batch_allowed": False},
    Tier.PRO: {"requests_limit": 1000, "max_file_size_mb": 20, "batch_allowed": True},
    Tier.ENTERPRISE: {"requests_limit": 100_000, "max_file_size_mb": 50, "batch_allowed": True},
}


@dataclass
class ApiKey:
    key: str
    user_email: str
    tier: str
    requests_used: int
    requests_limit: int
    created_at: str
    expires_at: str | None
    is_active: bool
    last_reset: str

    @property
    def remaining_requests(self) -> int:
        return max(0, self.requests_limit - self.requests_used)

    @property
    def is_over_limit(self) -> bool:
        return self.requests_used >= self.requests_limit

    def to_dict(self) -> dict:
        return {
            "key_prefix": self.key[:8] + "...",
            "user_email": self.user_email,
            "tier": self.tier,
            "requests_used": self.requests_used,
            "requests_limit": self.requests_limit,
            "remaining_requests": self.remaining_requests,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "is_active": self.is_active,
        }
