import pytest
from django.conf import settings
from django.test import override_settings
from django.utils import timezone

from pleate_backend.ai_chat.models import DailyUsage
from pleate_backend.apikeys.services import create_key
from pleate_backend.files.models import File
from pleate_backend.webhooks.models import Endpoint

pytestmark = pytest.mark.django_db


def _items(res):
    return {item["id"]: item for item in res.json()["items"]}


def test_usage_summary(auth_api, user, make_user):
    other = make_user()
    File.objects.create(owner=user, name="a.png", key="k1", size=1000, content_type="image/png")
    File.objects.create(owner=user, name="b.png", key="k2", size=500, content_type="image/png")
    File.objects.create(owner=other, name="c.png", key="k3", size=9999, content_type="image/png")
    DailyUsage.objects.create(user=user, day=timezone.now().date(), input_tokens=30, output_tokens=12)
    create_key(user, "ci")
    create_key(other, "ci")
    Endpoint.objects.create(owner_id=user.pk, url="https://hooks.example.com/x", secret="s", events=["*"])

    res = auth_api.get("/api/usage")
    assert res.status_code == 200
    assert res.json()["plan"] is None
    items = _items(res)
    assert items["storage"] == {
        "id": "storage",
        "label": "Storage",
        "used": 1500,
        "limit": settings.PLEATE.get("FILES", {}).get("USER_QUOTA", 500 * 1024 * 1024),
        "unit": "bytes",
    }
    assert items["ai_tokens"]["used"] == 42
    assert items["ai_tokens"]["limit"] == 200_000
    assert items["api_keys"]["used"] == 1
    assert items["api_keys"]["limit"] == 25
    assert items["webhooks"]["used"] == 1
    assert items["webhooks"]["limit"] == 20


def test_usage_reports_the_plan(auth_api, user):
    plans = [{"id": "free", "name": "Free"}]
    with override_settings(PLEATE={**settings.PLEATE, "BILLING": {"PLANS": plans}}):
        assert auth_api.get("/api/usage").json()["plan"] == "free"


def test_usage_unlimited_is_null(auth_api):
    with override_settings(PLEATE={**settings.PLEATE, "AI": {"DAILY_TOKEN_LIMIT": 0}}):
        assert _items(auth_api.get("/api/usage"))["ai_tokens"]["limit"] is None


def test_usage_is_cached_briefly(auth_api, user):
    auth_api.get("/api/usage")
    File.objects.create(owner=user, name="a.png", key="k1", size=1000, content_type="image/png")
    assert _items(auth_api.get("/api/usage"))["storage"]["used"] == 0


def test_usage_needs_a_user(api):
    assert api.get("/api/usage").status_code in (401, 403)
