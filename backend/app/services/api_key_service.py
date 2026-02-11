"""API key management service."""

import secrets
from datetime import UTC, datetime

from ..db.database import get_connection
from ..models.api_key import TIER_LIMITS, ApiKey, Tier


class ApiKeyService:
    """Manages API key CRUD and usage tracking."""

    @staticmethod
    def _now() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def _today() -> str:
        return datetime.now(UTC).strftime("%Y-%m-%d")

    def generate_key(self, user_email: str, tier: str = Tier.FREE) -> ApiKey:
        """Create a new API key for a user."""
        key = f"cc_{secrets.token_urlsafe(32)}"
        now = self._now()
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[Tier.FREE])

        with get_connection() as conn:
            conn.execute(
                """INSERT INTO api_keys (key, user_email, tier, requests_used, requests_limit,
                   created_at, is_active, last_reset)
                   VALUES (?, ?, ?, 0, ?, ?, 1, ?)""",
                (key, user_email, tier, limits["requests_limit"], now, self._today()),
            )
            conn.commit()

        return ApiKey(
            key=key,
            user_email=user_email,
            tier=tier,
            requests_used=0,
            requests_limit=limits["requests_limit"],
            created_at=now,
            expires_at=None,
            is_active=True,
            last_reset=self._today(),
        )

    def get_key(self, key: str) -> ApiKey | None:
        """Look up an API key."""
        with get_connection() as conn:
            row = conn.execute("SELECT * FROM api_keys WHERE key = ?", (key,)).fetchone()
            if not row:
                return None
            return self._row_to_key(row)

    def get_keys_by_email(self, email: str) -> list[ApiKey]:
        """Get all API keys for a user email."""
        with get_connection() as conn:
            rows = conn.execute("SELECT * FROM api_keys WHERE user_email = ? AND is_active = 1", (email,)).fetchall()
            return [self._row_to_key(r) for r in rows]

    def increment_usage(self, key: str) -> bool:
        """Increment request count. Resets daily. Returns False if over limit."""
        today = self._today()

        with get_connection() as conn:
            row = conn.execute("SELECT * FROM api_keys WHERE key = ? AND is_active = 1", (key,)).fetchone()
            if not row:
                return False

            # Daily reset
            if row["last_reset"] != today:
                conn.execute(
                    "UPDATE api_keys SET requests_used = 1, last_reset = ? WHERE key = ?",
                    (today, key),
                )
                conn.commit()
                return True

            if row["requests_used"] >= row["requests_limit"]:
                return False

            conn.execute("UPDATE api_keys SET requests_used = requests_used + 1 WHERE key = ?", (key,))
            conn.commit()
            return True

    def rotate_key(self, old_key: str) -> ApiKey | None:
        """Revoke old key and generate a new one with the same tier/email."""
        existing = self.get_key(old_key)
        if not existing or not existing.is_active:
            return None

        # Deactivate old key
        self.revoke_key(old_key)

        # Generate new key with same tier
        return self.generate_key(existing.user_email, existing.tier)

    def revoke_key(self, key: str) -> bool:
        """Deactivate an API key."""
        with get_connection() as conn:
            cursor = conn.execute("UPDATE api_keys SET is_active = 0 WHERE key = ? AND is_active = 1", (key,))
            conn.commit()
            return cursor.rowcount > 0

    def upgrade_tier(self, key: str, new_tier: str) -> bool:
        """Upgrade an API key to a new tier."""
        limits = TIER_LIMITS.get(new_tier)
        if not limits:
            return False

        with get_connection() as conn:
            cursor = conn.execute(
                "UPDATE api_keys SET tier = ?, requests_limit = ? WHERE key = ? AND is_active = 1",
                (new_tier, limits["requests_limit"], key),
            )
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def _row_to_key(row: dict) -> ApiKey:
        return ApiKey(
            key=row["key"],
            user_email=row["user_email"],
            tier=row["tier"],
            requests_used=row["requests_used"],
            requests_limit=row["requests_limit"],
            created_at=row["created_at"],
            expires_at=row["expires_at"],
            is_active=bool(row["is_active"]),
            last_reset=row["last_reset"],
        )


api_key_service = ApiKeyService()
