"""
Billing helpers.

    from pleate_backend.billing.services import active_subscription
    sub = active_subscription(request.user)       # Subscription or None
    if sub and sub.plan_id == "pro": ...
"""

import logging
import time
from contextlib import suppress
from datetime import UTC, datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext as _

from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.core.exceptions import ApiError

from .models import Customer, StripeEvent, Subscription
from .signals import subscription_changed

logger = logging.getLogger("pleate.billing")

INTERVALS = ("month", "year")
# Statuses that grant access. ``past_due`` keeps access while Stripe retries the payment.
ACTIVE_STATUSES = ("active", "trialing", "past_due")
ENDED_STATUSES = ("canceled", "incomplete_expired")
# Currencies without minor units: https://docs.stripe.com/currencies#zero-decimal
ZERO_DECIMAL = {
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
    "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
}  # fmt: skip
# A webhook delivery owns its event this long; a crashed worker's claim expires after it.
EVENT_LEASE = timedelta(minutes=5)
CHECKOUT_LOCK_SECONDS = 30
# Clicks within this window reuse the same Checkout Session through Stripe's idempotency key.
CHECKOUT_IDEMPOTENCY_WINDOW = 60


def conf() -> dict:
    return pleate_settings.BILLING


def is_configured() -> bool:
    return bool(conf()["STRIPE_SECRET_KEY"])


def get_client():
    """A ``stripe.StripeClient`` for the configured secret key."""
    import stripe

    key = conf()["STRIPE_SECRET_KEY"]
    if not key:
        raise ApiError("billing_not_configured", _("Payments are not available right now."), 503)
    return stripe.StripeClient(key)


def _stripe_error(exc) -> ApiError:
    logger.warning("stripe request failed: %s", exc)
    return ApiError("billing_error", _("The payment provider is not responding. Try again later."), 502)


# Plans


def plans() -> list[dict]:
    return list(conf()["PLANS"] or [])


def get_plan(plan_id: str) -> dict | None:
    return next((p for p in plans() if p.get("id") == plan_id), None)


def _price(plan: dict, interval: str) -> dict | None:
    """``{"price_id", "amount"}`` for an interval. Accepts the short ``"price_x"`` form too."""
    value = (plan.get("prices") or {}).get(interval)
    if not value:
        return None
    if isinstance(value, str):
        return {"price_id": value, "amount": None}
    return {"price_id": value.get("price_id"), "amount": value.get("amount")}


def price_id_for(plan: dict, interval: str) -> str | None:
    price = _price(plan, interval)
    return price["price_id"] if price else None


def plan_for_price(price_id: str) -> tuple[str | None, str | None]:
    """Maps a Stripe price id back to ``(plan_id, interval)`` through PLANS."""
    for plan in plans():
        for interval in INTERVALS:
            if price_id and price_id_for(plan, interval) == price_id:
                return plan["id"], interval
    return None, None


def is_free(plan: dict) -> bool:
    return (
        not plan.get("custom")
        and not plan.get("custom_price")
        and not any(price_id_for(plan, i) for i in INTERVALS)
    )


def _text(value):
    return None if value is None else str(value)


def _major(amount: int, currency: str) -> float | int:
    value = amount if currency.lower() in ZERO_DECIMAL else amount / 100
    value = round(value, 2)
    return int(value) if float(value).is_integer() else value


def _pricing_price(plan: dict, currency: str) -> dict | None:
    """Per month amounts in major units, as the pleate Pricing component expects."""
    if plan.get("custom") or plan.get("custom_price"):
        return None
    month, year = _price(plan, "month"), _price(plan, "year")
    if month is None and year is None:
        return {"monthly": 0, "yearly": 0}
    monthly = _major(month["amount"], currency) if month and month["amount"] is not None else None
    # Yearly is shown as its monthly equivalent.
    yearly = None
    if year and year["amount"] is not None:
        # Zero decimal currencies (JPY...) have no fractional unit to show.
        per_month = year["amount"] / 12
        yearly = _major(round(per_month) if currency.lower() in ZERO_DECIMAL else per_month, currency)
    if monthly is None and yearly is None:
        return None
    return {
        "monthly": monthly if monthly is not None else yearly,
        "yearly": yearly if yearly is not None else monthly,
    }


def _features(items) -> list:
    out = []
    for item in items or []:
        if isinstance(item, dict):
            feature = {"label": _text(item.get("label")), "included": bool(item.get("included", True))}
            if item.get("hint"):
                feature["hint"] = _text(item["hint"])
            out.append(feature)
        else:
            out.append(_text(item))
    return out


def current_plan_id(user) -> str | None:
    if not user or not user.is_authenticated:
        return None
    sub = active_subscription(user)
    if sub:
        return sub.plan_id or None
    free = next((p for p in plans() if is_free(p)), None)
    return free["id"] if free else None


def plans_payload(user=None) -> dict:
    currency = (conf()["CURRENCY"] or "usd").lower()
    current = current_plan_id(user)
    out = []
    for plan in plans():
        amounts = {i: (_price(plan, i) or {}).get("amount") for i in INTERVALS}
        out.append(
            {
                "id": plan["id"],
                "name": _text(plan.get("name", plan["id"])),
                "description": _text(plan.get("description")),
                "features": _features(plan.get("features")),
                "highlighted": bool(plan.get("highlighted", False)),
                "badge": _text(plan.get("badge")),
                "cta": _text(plan.get("cta")),
                "price": _pricing_price(plan, currency),
                "custom_price": _text(plan.get("custom_price")),
                "amounts": amounts,
                "intervals": [i for i in INTERVALS if price_id_for(plan, i)],
                "current": current is not None and plan["id"] == current,
            }
        )
    return {
        "currency": currency.upper(),
        "trial_days": int(conf()["TRIAL_DAYS"] or 0),
        "current_plan": current,
        "plans": out,
    }


# Subscriptions


def active_subscription(user) -> Subscription | None:
    """The user's subscription that grants access (active, trialing or past_due), or None."""
    if not user or not getattr(user, "is_authenticated", False):
        return None
    return Subscription.objects.filter(user=user, status__in=ACTIVE_STATUSES).order_by("-updated_at").first()


def current_subscription(user) -> Subscription | None:
    """The active subscription, else the most recent one (for example a canceled one)."""
    return active_subscription(user) or Subscription.objects.filter(user=user).order_by("-updated_at").first()


def me_field(user):
    sub = active_subscription(user)
    if sub is None:
        return None
    return {
        "plan_id": sub.plan_id,
        "status": sub.status,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "cancel_at_period_end": sub.cancel_at_period_end,
    }


def get_or_create_customer(user, client) -> str:
    existing = Customer.objects.filter(user=user).first()
    if existing:
        return existing.stripe_customer_id
    import stripe

    try:
        remote = client.v1.customers.create(
            params={"email": user.email, "name": user.name or "", "metadata": {"user_id": str(user.pk)}}
        )
    except stripe.StripeError as exc:
        raise _stripe_error(exc) from exc
    try:
        Customer.objects.create(user=user, stripe_customer_id=remote.id)
    except IntegrityError:
        return Customer.objects.get(user=user).stripe_customer_id
    return remote.id


def _with_query(url: str, query: str) -> str:
    return url + ("&" if "?" in url else "?") + query


def create_checkout(user, plan_id: str, interval: str) -> str:
    plan = get_plan(plan_id)
    price_id = plan and price_id_for(plan, interval)
    if not price_id:
        raise ApiError("invalid_plan", _("This plan is not available."), 400)
    client = get_client()
    lock = f"pleate:billing:checkout:{user.pk}"
    if not cache.add(lock, 1, CHECKOUT_LOCK_SECONDS):
        raise ApiError("checkout_in_progress", _("A checkout is already starting. Try again."), 409)
    try:
        return _create_checkout(user, client, plan_id, interval, price_id)
    finally:
        cache.delete(lock)


def _create_checkout(user, client, plan_id: str, interval: str, price_id: str) -> str:
    if active_subscription(user):
        raise ApiError(
            "already_subscribed",
            _("You already have a subscription. Manage it from the billing portal."),
            409,
        )
    customer = get_or_create_customer(user, client)
    metadata = {"user_id": str(user.pk), "plan_id": plan_id}
    subscription_data: dict = {"metadata": metadata}
    trial = int(conf()["TRIAL_DAYS"] or 0)
    if trial > 0:
        subscription_data["trial_period_days"] = trial
    params = {
        "mode": "subscription",
        "customer": customer,
        "client_reference_id": str(user.pk),
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": _with_query(frontend_url("BILLING_SUCCESS"), "session_id={CHECKOUT_SESSION_ID}"),
        "cancel_url": frontend_url("BILLING_CANCEL"),
        "metadata": metadata,
        "subscription_data": subscription_data,
    }
    import stripe

    try:
        bucket = int(time.time()) // CHECKOUT_IDEMPOTENCY_WINDOW
        session = client.v1.checkout.sessions.create(
            params=params,
            options={"idempotency_key": f"checkout-{user.pk}-{plan_id}-{interval}-{bucket}"},
        )
    except stripe.StripeError as exc:
        raise _stripe_error(exc) from exc
    return session.url


def portal_return_url() -> str:
    paths = pleate_settings.FRONTEND_PATHS
    if "BILLING_PORTAL_RETURN" in paths:
        return frontend_url("BILLING_PORTAL_RETURN")
    return pleate_settings.FRONTEND_URL.rstrip("/") + "/"


def create_portal(user) -> str:
    customer = Customer.objects.filter(user=user).first()
    if customer is None:
        raise ApiError("no_customer", _("There is no billing account yet. Choose a plan first."), 400)
    client = get_client()
    import stripe

    try:
        session = client.v1.billing_portal.sessions.create(
            params={"customer": customer.stripe_customer_id, "return_url": portal_return_url()}
        )
    except stripe.StripeError as exc:
        raise _stripe_error(exc) from exc
    return session.url


def cancel_user_subscriptions(user):
    """Cancels every live Stripe subscription of ``user`` immediately. Never raises."""
    subs = list(Subscription.objects.filter(user=user).exclude(status__in=ENDED_STATUSES))
    if not subs or not is_configured():
        return
    try:
        client = get_client()
        for sub in subs:
            try:
                client.v1.subscriptions.cancel(sub.stripe_subscription_id)
            except Exception:  # noqa: BLE001
                logger.exception("could not cancel subscription %s", sub.stripe_subscription_id)
    except Exception:  # noqa: BLE001
        logger.exception("could not cancel subscriptions of user %s", user.pk)


# Webhooks


def _ts(value) -> datetime | None:
    if value in (None, ""):
        return None
    return datetime.fromtimestamp(int(value), tz=UTC)


def _id(value) -> str | None:
    """Stripe fields are an id or, when expanded, an object."""
    if isinstance(value, dict):
        return value.get("id")
    return value or None


def _user_by_id(user_id):
    if not user_id:
        return None
    try:
        return get_user_model().objects.filter(pk=user_id).first()
    except Exception:  # noqa: BLE001  not an ObjectId
        return None


def _user_by_customer(customer_id):
    if not customer_id:
        return None
    row = Customer.objects.filter(stripe_customer_id=customer_id).select_related("user").first()
    return row.user if row else None


def _link_customer(user, customer_id):
    if not user or not customer_id:
        return
    if Customer.objects.filter(stripe_customer_id=customer_id).exists():
        return
    with suppress(IntegrityError):
        Customer.objects.update_or_create(user=user, defaults={"stripe_customer_id": customer_id})


def _subscription(sub_id) -> Subscription | None:
    if not sub_id:
        return None
    return Subscription.objects.filter(stripe_subscription_id=sub_id).select_related("user").first()


def _fetch_subscription(sub_id: str) -> dict:
    remote = get_client().v1.subscriptions.retrieve(sub_id)
    return remote.to_dict() if hasattr(remote, "to_dict") else dict(remote)


def sync_subscription(
    data: dict, event_created: datetime | None = None, fetched: bool = False
) -> Subscription | None:
    """
    Creates or updates the local copy of a Stripe subscription object.
    ``fetched`` tells that ``data`` was just read from Stripe, so it is current.
    """
    sub_id = data["id"]
    existing = _subscription(sub_id)
    if existing and event_created and existing.last_event_at and not fetched:
        if event_created < existing.last_event_at:
            return existing  # a late delivery of an older state
        if event_created == existing.last_event_at:
            # Same second: the order is unknown, so ask Stripe for the current state.
            # A failure raises and Stripe delivers the event again later.
            data = _fetch_subscription(sub_id)
    metadata = data.get("metadata") or {}
    customer_id = _id(data.get("customer"))
    user = (
        (existing and existing.user) or _user_by_id(metadata.get("user_id")) or _user_by_customer(customer_id)
    )
    if user is None:
        logger.warning("subscription %s has no matching user", sub_id)
        return None

    items = (data.get("items") or {}).get("data") or []
    item = items[0] if items else {}
    price = item.get("price") or {}
    price_id = _id(price) or ""
    plan_id, interval = plan_for_price(price_id)
    if plan_id is None:
        plan_id = metadata.get("plan_id", "")
        interval = ((price.get("recurring") or {}) if isinstance(price, dict) else {}).get("interval", "")
    period_end = data.get("current_period_end") or item.get("current_period_end")

    sub = existing or Subscription(user=user, stripe_subscription_id=sub_id)
    previous = existing.status if existing else None
    sub.plan_id = plan_id or ""
    sub.price_id = price_id
    sub.interval = interval or ""
    sub.status = data.get("status") or sub.status
    sub.current_period_end = _ts(period_end)
    sub.cancel_at_period_end = bool(data.get("cancel_at_period_end")) or bool(data.get("cancel_at"))
    sub.trial_end = _ts(data.get("trial_end"))
    if event_created and (not sub.last_event_at or event_created > sub.last_event_at):
        sub.last_event_at = event_created
    try:
        sub.save()
    except IntegrityError:  # created concurrently by another delivery
        return sync_subscription(data, event_created, fetched)
    _link_customer(user, customer_id)
    if previous != sub.status:
        subscription_changed.send(sender=Subscription, user=user, subscription=sub, previous_status=previous)
    return sub


def _set_status(sub: Subscription, status: str, event_created: datetime | None = None):
    previous = sub.status
    if previous == status:
        return
    if event_created:
        if sub.last_event_at and event_created < sub.last_event_at:
            return  # a newer event already set the state
        sub.last_event_at = event_created
    sub.status = status
    sub.save(update_fields=["status", "last_event_at", "updated_at"])
    subscription_changed.send(sender=Subscription, user=sub.user, subscription=sub, previous_status=previous)


def _invoice_subscription_id(invoice: dict) -> str | None:
    legacy = _id(invoice.get("subscription"))
    if legacy:
        return legacy
    details = ((invoice.get("parent") or {}).get("subscription_details")) or {}
    return _id(details.get("subscription"))


def _notify(user, kind: str, title: str, body: str = "", url: str = ""):
    try:
        from pleate_backend.notifications.services import notify
    except ImportError:
        return
    try:
        notify(user, kind, title, body=body, url=url)
    except Exception:  # noqa: BLE001
        logger.exception("could not notify user %s", user.pk)


def _on_checkout_completed(obj: dict, created):
    metadata = obj.get("metadata") or {}
    user = _user_by_id(obj.get("client_reference_id") or metadata.get("user_id"))
    _link_customer(user, _id(obj.get("customer")))
    sub_id = _id(obj.get("subscription"))
    if user is None or not sub_id or Subscription.objects.filter(stripe_subscription_id=sub_id).exists():
        return
    # The customer.subscription.* events carry the same data; fetching makes the
    # subscription visible as soon as the user lands back on the site.
    try:
        data = _fetch_subscription(sub_id)
    except Exception:  # noqa: BLE001
        logger.warning("could not fetch subscription %s", sub_id, exc_info=True)
        return
    data.setdefault("metadata", {}).setdefault("user_id", str(user.pk))
    sync_subscription(data, created, fetched=True)


def _on_payment_failed(obj: dict, created):
    sub = _subscription(_invoice_subscription_id(obj))
    user = sub.user if sub else _user_by_customer(_id(obj.get("customer")))
    if user is None:
        return
    _notify(
        user,
        "billing.payment_failed",
        _("Your payment failed"),
        body=_("We could not charge your payment method. Update it to keep your subscription."),
        url=portal_return_url(),
    )


def _on_invoice_paid(obj: dict, created):
    sub = _subscription(_invoice_subscription_id(obj))
    if sub and sub.status in ("past_due", "unpaid", "incomplete"):
        _set_status(sub, "active", created)


HANDLERS = {
    "checkout.session.completed": _on_checkout_completed,
    "customer.subscription.created": sync_subscription,
    "customer.subscription.updated": sync_subscription,
    "customer.subscription.deleted": sync_subscription,
    "invoice.payment_failed": _on_payment_failed,
    "invoice.paid": _on_invoice_paid,
}


def process_event(event: dict) -> bool:
    """
    Applies a verified Stripe event once. Returns False for a replay. A delivery
    claims the event with a lease, so a redelivery while it runs gets a 409 and
    Stripe tries again later. If a handler raises, the claim is released and the
    event stays unprocessed so Stripe's retry runs it again.
    """
    event_id = event["id"]
    now = timezone.now()
    try:
        StripeEvent.objects.create(event_id=event_id, type=event.get("type", ""), started_at=now)
    except IntegrityError:
        claimed = (
            StripeEvent.objects.filter(event_id=event_id, processed_at=None)
            .filter(Q(started_at=None) | Q(started_at__lt=now - EVENT_LEASE))
            .update(started_at=now)
        )
        if not claimed:
            if StripeEvent.objects.filter(event_id=event_id, processed_at__isnull=False).exists():
                return False
            raise ApiError("event_in_progress", _("This event is being processed."), 409) from None
    record = StripeEvent.objects.filter(event_id=event_id)
    handler = HANDLERS.get(event.get("type", ""))
    try:
        if handler:
            handler((event.get("data") or {}).get("object") or {}, _ts(event.get("created")))
    except BaseException:
        record.update(started_at=None)
        raise
    record.update(processed_at=timezone.now())
    return True
