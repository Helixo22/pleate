import hashlib
import hmac
import json
import sys
import time
import types
from types import SimpleNamespace

import pytest
import stripe
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from pleate_backend.billing import services
from pleate_backend.billing.models import Customer, StripeEvent, Subscription
from pleate_backend.billing.permissions import HasActiveSubscription
from pleate_backend.billing.signals import subscription_changed

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()

WEBHOOK_SECRET = "whsec_test_0123456789"
PLANS = [
    {
        "id": "free",
        "name": "Free",
        "description": "For trying things out",
        "features": ["1 project"],
        "cta": "Get started",
    },
    {
        "id": "pro",
        "name": "Pro",
        "description": "For professionals",
        "features": ["Unlimited projects", {"label": "Priority support", "hint": "Answers within 4 hours"}],
        "highlighted": True,
        "badge": "Best value",
        "cta": "Start free trial",
        "prices": {
            "month": {"price_id": "price_pro_m", "amount": 900},
            "year": {"price_id": "price_pro_y", "amount": 9000},
        },
    },
    {
        "id": "team",
        "name": "Team",
        "cta": "Choose Team",
        "prices": {"month": {"price_id": "price_team_m", "amount": 2900}},
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "custom_price": "Contact us",
        "cta": "Talk to sales",
        "features": [{"label": "SSO"}, {"label": "On premise", "included": False}],
    },
]


def billing_conf(**overrides):
    return {
        "STRIPE_SECRET_KEY": "sk_test_123",
        "STRIPE_WEBHOOK_SECRET": WEBHOOK_SECRET,
        "CURRENCY": "usd",
        "TRIAL_DAYS": 0,
        "PLANS": PLANS,
        **overrides,
    }


@pytest.fixture(autouse=True)
def billing_settings(settings):
    settings.PLEATE = {**settings.PLEATE, "BILLING": billing_conf()}
    return settings


def set_billing(settings, **overrides):
    settings.PLEATE = {**settings.PLEATE, "BILLING": billing_conf(**overrides)}


class FakeStripe:
    """Stands in for ``stripe.StripeClient``: records every call."""

    def __init__(self):
        self.calls = []
        self.remote_subscriptions = {}
        self.fail_cancel = False
        record = self._record
        self.v1 = SimpleNamespace(
            customers=SimpleNamespace(create=lambda params: record("customers.create", params, id="cus_new")),
            checkout=SimpleNamespace(
                sessions=SimpleNamespace(
                    create=lambda params: record(
                        "checkout.create", params, url="https://checkout.stripe.test/s1"
                    )
                )
            ),
            billing_portal=SimpleNamespace(
                sessions=SimpleNamespace(
                    create=lambda params: record(
                        "portal.create", params, url="https://billing.stripe.test/p1"
                    )
                )
            ),
            subscriptions=SimpleNamespace(cancel=self._cancel, retrieve=self._retrieve),
        )

    def _record(self, name, params, **result):
        self.calls.append((name, params))
        return SimpleNamespace(**result)

    def _cancel(self, sub_id, params=None):
        self.calls.append(("subscriptions.cancel", sub_id))
        if self.fail_cancel:
            raise stripe.APIConnectionError("network down")
        return SimpleNamespace(id=sub_id, status="canceled")

    def _retrieve(self, sub_id, params=None):
        self.calls.append(("subscriptions.retrieve", sub_id))
        return self.remote_subscriptions[sub_id]

    def named(self, name):
        return [params for call, params in self.calls if call == name]


@pytest.fixture
def fake_stripe(monkeypatch):
    fake = FakeStripe()
    keys = []

    def factory(api_key, **kwargs):
        keys.append(api_key)
        return fake

    monkeypatch.setattr(stripe, "StripeClient", factory)
    fake.keys = keys
    return fake


@pytest.fixture
def changes():
    seen = []

    def receiver(sender, user, subscription, previous_status, **kwargs):
        seen.append((subscription.status, previous_status))

    subscription_changed.connect(receiver)
    yield seen
    subscription_changed.disconnect(receiver)


@pytest.fixture
def notifications(monkeypatch):
    sent = []
    module = types.ModuleType("pleate_backend.notifications.services")

    def notify(user, kind, title, body="", url="", data=None):
        sent.append({"user": user, "kind": kind, "title": str(title), "body": str(body), "url": url})

    module.notify = notify
    monkeypatch.setitem(sys.modules, "pleate_backend.notifications.services", module)
    return sent


# Helpers


def sign(payload: str, secret: str = WEBHOOK_SECRET, timestamp: int | None = None) -> str:
    """A real Stripe-Signature header: v1 is HMAC SHA256 of "<t>.<payload>"."""
    t = int(time.time()) if timestamp is None else timestamp
    digest = hmac.new(secret.encode(), f"{t}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"t={t},v1={digest}"


_counter = {"n": 0}


def event(type_, obj, event_id=None, created=None):
    _counter["n"] += 1
    return {
        "id": event_id or f"evt_{_counter['n']}",
        "object": "event",
        "type": type_,
        "created": created or int(time.time()),
        "data": {"object": obj},
    }


def post_event(api, evt, secret=WEBHOOK_SECRET, header=None):
    payload = json.dumps(evt)
    return api.post(
        "/api/billing/webhook",
        data=payload,
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE=header if header is not None else sign(payload, secret),
    )


def sub_object(user, sub_id="sub_1", status="active", price="price_pro_m", interval="month", **extra):
    period_end = int(time.time()) + 30 * 86400
    return {
        "id": sub_id,
        "object": "subscription",
        "customer": "cus_1",
        "status": status,
        "cancel_at_period_end": False,
        "trial_end": None,
        "metadata": {"user_id": str(user.pk)},
        "items": {
            "object": "list",
            "data": [
                {
                    "id": "si_1",
                    "current_period_end": period_end,
                    "price": {"id": price, "recurring": {"interval": interval}},
                }
            ],
        },
        **extra,
    }


def make_sub(user, status="active", plan="pro", sub_id="sub_x"):
    return Subscription.objects.create(
        user=user,
        stripe_subscription_id=sub_id,
        plan_id=plan,
        price_id="price_pro_m",
        interval="month",
        status=status,
    )


# Plans


def test_plans_shape_for_pricing_component(api):
    res = api.get("/api/billing/plans")
    assert res.status_code == 200
    body = res.json()
    assert body["currency"] == "USD"
    assert body["trial_days"] == 0
    assert body["current_plan"] is None
    plans = {p["id"]: p for p in body["plans"]}
    assert list(plans) == ["free", "pro", "team", "enterprise"]
    assert plans["pro"] == {
        "id": "pro",
        "name": "Pro",
        "description": "For professionals",
        "features": [
            "Unlimited projects",
            {"label": "Priority support", "included": True, "hint": "Answers within 4 hours"},
        ],
        "highlighted": True,
        "badge": "Best value",
        "cta": "Start free trial",
        "price": {"monthly": 9, "yearly": 7.5},
        "custom_price": None,
        "amounts": {"month": 900, "year": 9000},
        "intervals": ["month", "year"],
        "current": False,
    }
    assert plans["free"]["price"] == {"monthly": 0, "yearly": 0}
    assert plans["free"]["intervals"] == []
    assert plans["team"]["price"] == {"monthly": 29, "yearly": 29}
    assert plans["team"]["intervals"] == ["month"]
    assert plans["enterprise"]["price"] is None
    assert plans["enterprise"]["custom_price"] == "Contact us"
    assert plans["enterprise"]["features"][1] == {"label": "On premise", "included": False}


def test_plans_zero_decimal_currency(api, settings):
    set_billing(
        settings,
        CURRENCY="jpy",
        PLANS=[{"id": "p", "name": "P", "prices": {"month": {"price_id": "x", "amount": 1200}}}],
    )
    body = api.get("/api/billing/plans").json()
    assert body["currency"] == "JPY"
    assert body["plans"][0]["price"] == {"monthly": 1200, "yearly": 1200}


def test_plans_current_plan(auth_api, user):
    body = auth_api.get("/api/billing/plans").json()
    assert body["current_plan"] == "free"
    assert [p["id"] for p in body["plans"] if p["current"]] == ["free"]
    make_sub(user)
    body = auth_api.get("/api/billing/plans").json()
    assert body["current_plan"] == "pro"
    assert [p["id"] for p in body["plans"] if p["current"]] == ["pro"]


# Subscription


def test_subscription_endpoint(auth_api, user):
    assert auth_api.get("/api/billing/subscription").json() == {"subscription": None}
    make_sub(user, status="canceled", sub_id="sub_old")
    assert auth_api.get("/api/billing/subscription").json()["subscription"]["status"] == "canceled"
    make_sub(user, status="trialing", sub_id="sub_new")
    sub = auth_api.get("/api/billing/subscription").json()["subscription"]
    assert sub["status"] == "trialing"
    assert sub["active"] is True
    assert sub["plan_id"] == "pro"


def test_subscription_requires_auth(api):
    assert api.get("/api/billing/subscription").status_code == 401


# Checkout


def test_checkout_creates_customer_and_session(auth_api, user, fake_stripe, settings):
    set_billing(settings, TRIAL_DAYS=14)
    res = auth_api.post("/api/billing/checkout", {"plan": "pro", "interval": "year"})
    assert res.status_code == 200, res.content
    assert res.json() == {"url": "https://checkout.stripe.test/s1"}
    assert fake_stripe.keys == ["sk_test_123"]
    [customer] = fake_stripe.named("customers.create")
    assert customer["email"] == user.email
    assert customer["metadata"] == {"user_id": str(user.pk)}
    assert Customer.objects.get(user=user).stripe_customer_id == "cus_new"
    [params] = fake_stripe.named("checkout.create")
    assert params["mode"] == "subscription"
    assert params["customer"] == "cus_new"
    assert params["client_reference_id"] == str(user.pk)
    assert params["line_items"] == [{"price": "price_pro_y", "quantity": 1}]
    assert params["success_url"] == "http://app.test/billing/success?session_id={CHECKOUT_SESSION_ID}"
    assert params["cancel_url"] == "http://app.test/pricing"
    assert params["metadata"] == {"user_id": str(user.pk), "plan_id": "pro"}
    assert params["subscription_data"] == {"metadata": params["metadata"], "trial_period_days": 14}

    # The customer is reused.
    auth_api.post("/api/billing/checkout", {"plan": "team", "interval": "month"})
    assert len(fake_stripe.named("customers.create")) == 1
    assert fake_stripe.named("checkout.create")[1]["customer"] == "cus_new"
    assert "trial_period_days" in fake_stripe.named("checkout.create")[1]["subscription_data"]


def test_checkout_without_trial(auth_api, fake_stripe):
    auth_api.post("/api/billing/checkout", {"plan": "pro"})
    [params] = fake_stripe.named("checkout.create")
    assert params["line_items"][0]["price"] == "price_pro_m"
    assert "trial_period_days" not in params["subscription_data"]


@pytest.mark.parametrize(
    "data", [{"plan": "nope"}, {"plan": "free"}, {"plan": "enterprise"}, {"plan": "team", "interval": "year"}]
)
def test_checkout_invalid_plan(auth_api, fake_stripe, data):
    res = auth_api.post("/api/billing/checkout", data)
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_plan"
    assert fake_stripe.calls == []


def test_checkout_not_configured(auth_api, settings):
    set_billing(settings, STRIPE_SECRET_KEY=None)
    res = auth_api.post("/api/billing/checkout", {"plan": "pro"})
    assert res.status_code == 503
    assert res.json()["error"]["code"] == "billing_not_configured"


def test_checkout_already_subscribed(auth_api, user, fake_stripe):
    make_sub(user, status="past_due")
    res = auth_api.post("/api/billing/checkout", {"plan": "team"})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "already_subscribed"
    assert fake_stripe.calls == []


def test_checkout_stripe_error(auth_api, fake_stripe):
    def boom(params):
        raise stripe.APIConnectionError("down")

    fake_stripe.v1.checkout.sessions.create = boom
    res = auth_api.post("/api/billing/checkout", {"plan": "pro"})
    assert res.status_code == 502
    assert res.json()["error"]["code"] == "billing_error"


def test_checkout_requires_auth_and_csrf(api, user, fake_stripe):
    assert api.post("/api/billing/checkout", {"plan": "pro"}).status_code == 401
    client = APIClient(enforce_csrf_checks=True)
    client.login(email=user.email, password=PASSWORD)
    res = client.post("/api/billing/checkout", {"plan": "pro"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"


# Portal


def test_portal(auth_api, user, fake_stripe, settings):
    res = auth_api.post("/api/billing/portal")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "no_customer"
    Customer.objects.create(user=user, stripe_customer_id="cus_1")
    res = auth_api.post("/api/billing/portal")
    assert res.json() == {"url": "https://billing.stripe.test/p1"}
    assert fake_stripe.named("portal.create") == [
        {"customer": "cus_1", "return_url": "http://app.test/settings/billing"}
    ]
    settings.PLEATE = {**settings.PLEATE, "FRONTEND_PATHS": {"BILLING_PORTAL_RETURN": "/settings/billing"}}
    auth_api.post("/api/billing/portal")
    assert fake_stripe.named("portal.create")[1]["return_url"] == "http://app.test/settings/billing"


# Webhook


def test_webhook_rejects_bad_signatures(api, user):
    evt = event("customer.subscription.created", sub_object(user))
    for header in (
        "",
        "garbage",
        sign(json.dumps(evt), "whsec_other"),
        sign(json.dumps(evt), timestamp=int(time.time()) - 3600),
    ):
        res = post_event(api, evt, header=header)
        assert res.status_code == 400, header
        assert res.json()["error"]["code"] == "invalid_signature"
    # A valid signature for another body.
    res = api.post(
        "/api/billing/webhook",
        data=json.dumps(evt),
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE=sign(json.dumps({**evt, "id": "evt_other"})),
    )
    assert res.status_code == 400
    assert StripeEvent.objects.count() == 0
    assert Subscription.objects.count() == 0


def test_webhook_not_configured(api, user, settings):
    set_billing(settings, STRIPE_WEBHOOK_SECRET=None)
    res = post_event(api, event("invoice.paid", {}))
    assert res.status_code == 503
    assert res.json()["error"]["code"] == "billing_not_configured"


def test_webhook_ignores_session_and_csrf(user):
    client = APIClient(enforce_csrf_checks=True)
    client.login(email=user.email, password=PASSWORD)
    res = post_event(client, event("some.other.event", {}))
    assert res.status_code == 200
    assert res.json() == {"received": True, "duplicate": False}


def test_subscription_lifecycle(api, user, changes):
    created = sub_object(user, status="trialing", trial_end=int(time.time()) + 86400)
    assert post_event(api, event("customer.subscription.created", created)).status_code == 200
    sub = Subscription.objects.get()
    assert (sub.user, sub.plan_id, sub.interval, sub.status) == (user, "pro", "month", "trialing")
    assert sub.current_period_end is not None
    assert sub.trial_end is not None
    assert Customer.objects.get(user=user).stripe_customer_id == "cus_1"
    assert services.active_subscription(user) == sub

    updated = sub_object(user, price="price_pro_y", interval="year", cancel_at_period_end=True)
    post_event(api, event("customer.subscription.updated", updated))
    sub.refresh_from_db()
    assert (sub.status, sub.interval, sub.price_id, sub.cancel_at_period_end) == (
        "active",
        "year",
        "price_pro_y",
        True,
    )

    post_event(api, event("customer.subscription.deleted", sub_object(user, status="canceled")))
    sub.refresh_from_db()
    assert sub.status == "canceled"
    assert services.active_subscription(user) is None
    assert changes == [("trialing", None), ("active", "trialing"), ("canceled", "active")]


def test_replayed_event_is_processed_once(api, user, changes):
    evt = event("customer.subscription.created", sub_object(user), event_id="evt_same")
    first = post_event(api, evt)
    assert first.json() == {"received": True, "duplicate": False}
    Subscription.objects.update(status="canceled")
    second = post_event(api, evt)
    assert second.status_code == 200
    assert second.json() == {"received": True, "duplicate": True}
    assert Subscription.objects.get().status == "canceled"
    assert StripeEvent.objects.get().processed_at is not None
    assert len(changes) == 1


def test_failed_event_is_retried(api, user, monkeypatch):
    evt = event("customer.subscription.created", sub_object(user), event_id="evt_retry")

    def boom(obj, created):
        raise RuntimeError("database hiccup")

    monkeypatch.setitem(services.HANDLERS, "customer.subscription.created", boom)
    with pytest.raises(RuntimeError):
        post_event(api, evt)
    assert StripeEvent.objects.get().processed_at is None
    monkeypatch.undo()
    assert post_event(api, evt).json()["duplicate"] is False
    assert Subscription.objects.count() == 1


def test_late_older_event_does_not_roll_back(api, user):
    now = int(time.time())
    post_event(api, event("customer.subscription.updated", sub_object(user, status="canceled"), created=now))
    post_event(
        api, event("customer.subscription.updated", sub_object(user, status="active"), created=now - 60)
    )
    assert Subscription.objects.get().status == "canceled"


def test_subscription_found_by_customer(api, user):
    Customer.objects.create(user=user, stripe_customer_id="cus_1")
    obj = sub_object(user)
    obj["metadata"] = {}
    post_event(api, event("customer.subscription.created", obj))
    assert Subscription.objects.get().user == user


def test_subscription_without_user_is_ignored(api, user):
    obj = sub_object(user, customer="cus_unknown")
    obj["metadata"] = {}
    obj["customer"] = "cus_unknown"
    assert post_event(api, event("customer.subscription.created", obj)).status_code == 200
    assert Subscription.objects.count() == 0


def test_unknown_price_uses_metadata(api, user):
    obj = sub_object(user, price="price_legacy", interval="year")
    obj["metadata"]["plan_id"] = "legacy"
    post_event(api, event("customer.subscription.created", obj))
    sub = Subscription.objects.get()
    assert (sub.plan_id, sub.interval) == ("legacy", "year")


def test_checkout_completed_links_customer_and_fetches_subscription(api, user, fake_stripe):
    remote = sub_object(user, sub_id="sub_9", customer="cus_9")
    remote["metadata"] = {}
    fake_stripe.remote_subscriptions["sub_9"] = remote
    session = {
        "id": "cs_1",
        "object": "checkout.session",
        "client_reference_id": str(user.pk),
        "customer": "cus_9",
        "subscription": "sub_9",
        "metadata": {"user_id": str(user.pk), "plan_id": "pro"},
    }
    post_event(api, event("checkout.session.completed", session))
    assert Customer.objects.get(user=user).stripe_customer_id == "cus_9"
    sub = Subscription.objects.get()
    assert (sub.stripe_subscription_id, sub.user, sub.status) == ("sub_9", user, "active")
    assert fake_stripe.named("subscriptions.retrieve") == ["sub_9"]


def test_payment_failed_notifies(api, user, notifications):
    make_sub(user, sub_id="sub_1")
    invoice = {
        "id": "in_1",
        "object": "invoice",
        "customer": "cus_1",
        "parent": {"subscription_details": {"subscription": "sub_1"}},
    }
    post_event(api, event("invoice.payment_failed", invoice))
    assert len(notifications) == 1
    assert notifications[0]["user"] == user
    assert notifications[0]["kind"] == "billing.payment_failed"
    assert notifications[0]["title"]


def test_payment_failed_without_notifications_app(api, user, monkeypatch):
    monkeypatch.setitem(
        sys.modules, "pleate_backend.notifications.services", None
    )  # import raises ImportError
    make_sub(user, sub_id="sub_1")
    res = post_event(api, event("invoice.payment_failed", {"id": "in_1", "subscription": "sub_1"}))
    assert res.status_code == 200


def test_invoice_paid_reactivates(api, user, changes):
    sub = make_sub(user, status="past_due", sub_id="sub_1")
    post_event(api, event("invoice.paid", {"id": "in_1", "subscription": "sub_1"}))
    sub.refresh_from_db()
    assert sub.status == "active"
    assert changes == [("active", "past_due")]


# Helpers


def test_me_field(auth_api, user):
    assert auth_api.get("/api/auth/me").json()["extra"]["subscription"] is None
    make_sub(user)
    extra = auth_api.get("/api/auth/me").json()["extra"]["subscription"]
    assert extra == {
        "plan_id": "pro",
        "status": "active",
        "current_period_end": None,
        "cancel_at_period_end": False,
    }


class AnyPlanView(APIView):
    permission_classes = [HasActiveSubscription]

    def get(self, request):
        return Response({"ok": True})


class ProView(AnyPlanView):
    permission_classes = [HasActiveSubscription(plans=["pro"])]


def _call(view, user=None):
    request = APIRequestFactory().get("/x")
    if user:
        force_authenticate(request, user)
    return view.as_view()(request)


def test_has_active_subscription(user, make_user):
    assert _call(AnyPlanView).status_code in (401, 403)
    res = _call(AnyPlanView, user)
    assert res.status_code == 403
    assert res.data["error"]["code"] == "subscription_required"
    make_sub(user, plan="team", sub_id="sub_team")
    assert _call(AnyPlanView, user).status_code == 200
    assert _call(ProView, user).status_code == 403
    pro_user = make_user()
    make_sub(pro_user, plan="pro", status="trialing", sub_id="sub_pro")
    assert _call(ProView, pro_user).status_code == 200
    Subscription.objects.filter(stripe_subscription_id="sub_pro").update(status="unpaid")
    assert _call(ProView, pro_user).status_code == 403


def test_account_deletion_cancels_subscription(auth_api, user, fake_stripe):
    make_sub(user, sub_id="sub_live")
    make_sub(user, status="canceled", sub_id="sub_dead")
    res = auth_api.delete("/api/auth/me", {"password": PASSWORD})
    assert res.status_code == 204
    assert fake_stripe.named("subscriptions.cancel") == ["sub_live"]
    assert Subscription.objects.count() == 0


def test_account_deletion_survives_stripe_errors(auth_api, user, fake_stripe):
    fake_stripe.fail_cancel = True
    make_sub(user, sub_id="sub_live")
    assert auth_api.delete("/api/auth/me", {"password": PASSWORD}).status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


def test_export_includes_billing(auth_api, user):
    Customer.objects.create(user=user, stripe_customer_id="cus_1")
    make_sub(user)
    data = auth_api.get("/api/auth/me/export").json()["billing"]
    assert data["customer_id"] == "cus_1"
    assert data["subscriptions"][0]["plan_id"] == "pro"
