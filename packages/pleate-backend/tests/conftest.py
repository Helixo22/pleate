import re

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

PASSWORD = "correct-horse-battery-9"


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def make_user(db):
    from django.contrib.auth import get_user_model

    counter = {"n": 0}

    def make(email=None, password=PASSWORD, **extra):
        counter["n"] += 1
        email = email or f"user{counter['n']}@example.com"
        extra.setdefault("email_verified", True)
        return get_user_model().objects.create_user(email=email, password=password, **extra)

    return make


@pytest.fixture
def user(make_user):
    return make_user(email="ada@example.com", name="Ada")


@pytest.fixture
def staff(make_user):
    return make_user(email="staff@example.com", is_staff=True, is_superuser=True)


@pytest.fixture
def auth_api(api, user):
    api.force_authenticate(user)
    return api


@pytest.fixture
def session_api(api, user):
    """Real session cookie, for endpoints that look at the session."""
    api.login(email=user.email, password=PASSWORD)
    return api


def link_token(message, param="token"):
    match = re.search(rf"[?&]{param}=([^\s&]+)", message.body)
    assert match, message.body
    return match.group(1)
