"""Tests for payment endpoints (Stripe is optional)."""


class TestPaymentEndpoints:
    async def test_checkout_returns_503_without_stripe(self, client):
        """Returns 503 when Stripe is not configured."""
        resp = await client.post(
            "/api/v1/payments/create-checkout",
            json={"api_key": "cc_fake", "tier": "pro"},
        )
        assert resp.status_code == 503
        assert "not configured" in resp.json()["detail"].lower()

    async def test_webhook_returns_503_without_stripe(self, client):
        """Returns 503 when Stripe webhook is not configured."""
        resp = await client.post("/api/v1/payments/webhook", content=b"")
        assert resp.status_code == 503
