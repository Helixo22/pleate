import datetime

import pytest
from django.contrib.auth import get_user_model

from pleate_backend.audit.services import MASK, mask
from pleate_backend.billing.services import _pricing_price
from pleate_backend.webhooks.services import envelope

User = get_user_model()


def test_mask_goes_into_lists():
    out = mask({"items": [{"token": "secret", "name": "a"}, 3]})
    assert out == {"items": [{"token": MASK, "name": "a"}, 3]}


def test_webhook_dates_are_iso_8601():
    when = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
    assert envelope("x", {"at": when, "other": object()})["data"]["at"] == "2026-01-01T00:00:00Z"


def test_yearly_per_month_has_no_fraction_in_zero_decimal_currencies(monkeypatch):
    prices = {"month": {"amount": 1000}, "year": {"amount": 10000}}
    monkeypatch.setattr("pleate_backend.billing.services._price", lambda plan, interval: prices[interval])
    assert _pricing_price({}, "jpy")["yearly"] == 833
    assert _pricing_price({}, "eur")["yearly"] == 8.33


@pytest.mark.django_db
def test_user_without_password_has_no_password():
    assert User.objects.create_user("Ada@Example.com").has_password is False
    user = User(email=" Bob@Example.COM ")
    user.clean()
    assert user.email == "bob@example.com"
