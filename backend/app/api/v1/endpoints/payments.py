"""Stripe payment endpoints for tier upgrades.

Stripe is an optional dependency. If not installed, endpoints return 503.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ....config import settings
from ....models.api_key import Tier
from ....services.api_key_service import api_key_service

router = APIRouter(prefix="/payments", tags=["payments"])

try:
    import stripe

    _STRIPE_AVAILABLE = True
except ImportError:
    _STRIPE_AVAILABLE = False


class CheckoutRequest(BaseModel):
    api_key: str
    tier: str  # "pro" or "enterprise"


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout_session(body: CheckoutRequest) -> CheckoutResponse:
    """Create a Stripe Checkout session for upgrading to Pro or Enterprise."""
    if not _STRIPE_AVAILABLE or not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured.")

    stripe.api_key = settings.stripe_secret_key

    key_obj = api_key_service.get_key(body.api_key)
    if not key_obj or not key_obj.is_active:
        raise HTTPException(status_code=404, detail="API key not found or revoked.")

    price_map: dict[str, str] = {
        Tier.PRO: settings.stripe_pro_price_id,
        Tier.ENTERPRISE: settings.stripe_enterprise_price_id,
    }
    price_id = price_map.get(body.tier)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid tier. Choose 'pro' or 'enterprise'.")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{settings.frontend_url}/api?upgrade=success",
            cancel_url=f"{settings.frontend_url}/api?upgrade=cancelled",
            metadata={"api_key": body.api_key, "tier": body.tier},
            customer_email=key_obj.user_email,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}") from e

    return CheckoutResponse(checkout_url=session.url or "")


@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict:
    """Handle Stripe webhook events (checkout.session.completed)."""
    if not _STRIPE_AVAILABLE or not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured.")

    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook: {e}") from e

    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        metadata = session_data.get("metadata", {})
        api_key = metadata.get("api_key")
        tier = metadata.get("tier")

        if api_key and tier:
            api_key_service.upgrade_tier(api_key, tier)

    return {"status": "ok"}
