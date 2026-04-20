"""
Stripe Checkout integration for DeezLink — uses the emergentintegrations library.

Exposes thin async helpers so server.py stays readable:
    - create_stripe_session_for_order(order, origin_url, webhook_url)
    - get_stripe_session_status(session_id, webhook_url)
    - handle_stripe_webhook(body_bytes, signature, webhook_url)

All helpers are idempotent and safe to call multiple times.
The caller is responsible for persisting state in Mongo (payment_transactions
and orders collections) and for triggering delivery / emails.
"""

import os
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout,
        CheckoutSessionRequest,
        CheckoutSessionResponse,
        CheckoutStatusResponse,
    )
    _STRIPE_AVAILABLE = True
except Exception as _e:  # pragma: no cover
    logger.warning(f"Stripe integration not available: {_e}")
    _STRIPE_AVAILABLE = False
    StripeCheckout = None  # type: ignore
    CheckoutSessionRequest = None  # type: ignore
    CheckoutSessionResponse = None  # type: ignore
    CheckoutStatusResponse = None  # type: ignore


def _get_api_key() -> Optional[str]:
    # Playbook uses STRIPE_API_KEY; we also accept legacy STRIPE_SECRET_KEY.
    return os.environ.get("STRIPE_API_KEY") or os.environ.get("STRIPE_SECRET_KEY") or None


def is_stripe_enabled() -> bool:
    return _STRIPE_AVAILABLE and bool(_get_api_key())


def _get_checkout(webhook_url: str) -> "StripeCheckout":
    if not _STRIPE_AVAILABLE:
        raise RuntimeError("emergentintegrations not installed")
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("STRIPE_API_KEY is not set")
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


async def create_stripe_session_for_order(
    order: Dict,
    origin_url: str,
    webhook_url: str,
) -> Tuple[str, str]:
    """
    Create a Stripe Checkout Session for a given DeezLink order.
    Amount & currency are taken SERVER-SIDE from the order document (never from
    the frontend) to prevent price manipulation.

    Returns:
        (session_id, session_url) — the hosted-checkout URL to redirect to.
    """
    checkout = _get_checkout(webhook_url)

    amount = float(order.get("price", 0))
    if amount <= 0:
        raise ValueError("Invalid order price")

    order_id = order.get("order_id")
    if not order_id:
        raise ValueError("Missing order_id")

    # Strip trailing slash so f-string concatenation is clean
    origin = (origin_url or "").rstrip("/")
    success_url = f"{origin}/order/{order_id}?stripe=1&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/order/{order_id}?stripe=cancel"

    metadata = {
        "order_id": str(order_id),
        "email": str(order.get("email", "")),
        "pack_id": str(order.get("pack_id", "")),
        "quantity": str(order.get("quantity", "")),
        "source": "deezlink_checkout",
    }

    req = CheckoutSessionRequest(
        amount=amount,          # EUR, float (Stripe wants float)
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        # default ['card']; we don't enable stripe-native crypto here because
        # DeezLink already has OxaPay for crypto.
    )

    session: CheckoutSessionResponse = await checkout.create_checkout_session(req)
    return session.session_id, session.url


async def get_stripe_session_status(session_id: str, webhook_url: str) -> Dict:
    """Return a dict snapshot of the Stripe session status."""
    checkout = _get_checkout(webhook_url)
    status: CheckoutStatusResponse = await checkout.get_checkout_status(session_id)
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "metadata": dict(status.metadata or {}),
    }


async def handle_stripe_webhook_event(body: bytes, signature: Optional[str], webhook_url: str) -> Dict:
    """
    Verify and parse a Stripe webhook event via emergentintegrations.
    Returns a dict with normalized fields for the caller to act on.
    """
    checkout = _get_checkout(webhook_url)
    event = await checkout.handle_webhook(body, signature)
    return {
        "event_type": getattr(event, "event_type", None),
        "event_id": getattr(event, "event_id", None),
        "session_id": getattr(event, "session_id", None),
        "payment_status": getattr(event, "payment_status", None),
        "metadata": dict(getattr(event, "metadata", {}) or {}),
    }
