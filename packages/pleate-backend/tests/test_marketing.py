import csv
import io

import pytest
from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from pleate_backend.marketing import services
from pleate_backend.marketing.models import ContactMessage, NewsletterSubscriber, WaitlistEntry

from .conftest import link_token

pytestmark = pytest.mark.django_db

BASE = {"SITE_NAME": "Plate", "FRONTEND_URL": "http://app.test", "EMAILS": {"ASYNC": False}}
CONTACT = {
    "name": "Grace",
    "email": "Grace@Example.com",
    "subject": "Hello",
    "message": "I would like a demo please.",
}


def settings_with(**marketing):
    return override_settings(PLEATE={**BASE, "MARKETING": marketing})


# Newsletter


def test_subscribe_double_opt_in_flow(api):
    res = api.post("/api/marketing/newsletter/subscribe", {"email": "New@Example.com", "source": "footer"})
    assert res.status_code == 202, res.content
    assert res.json() == {"confirmation_required": True}
    sub = NewsletterSubscriber.objects.get(email="new@example.com")
    assert sub.status == "pending"
    assert sub.source == "footer"
    assert len(mail.outbox) == 1
    assert "http://app.test/newsletter/confirm?token=" in mail.outbox[0].body
    token = link_token(mail.outbox[0])

    res = api.post("/api/marketing/newsletter/confirm", {"token": token})
    assert res.status_code == 200
    assert res.json() == {"email": "new@example.com", "status": "subscribed"}
    sub.refresh_from_db()
    assert sub.status == "subscribed"
    assert sub.confirmed_at is not None


def test_subscribe_answer_does_not_reveal_state(api):
    first = api.post("/api/marketing/newsletter/subscribe", {"email": "a@example.com"})
    NewsletterSubscriber.objects.filter(email="a@example.com").update(status="subscribed")
    again = api.post("/api/marketing/newsletter/subscribe", {"email": "a@example.com"})
    NewsletterSubscriber.objects.filter(email="a@example.com").update(status="unsubscribed")
    after_unsub = api.post("/api/marketing/newsletter/subscribe", {"email": "a@example.com"})
    assert first.status_code == again.status_code == after_unsub.status_code == 202
    assert first.content == again.content == after_unsub.content
    assert NewsletterSubscriber.objects.count() == 1
    # Already subscribed: no new email. Unsubscribed: confirmation again.
    assert len(mail.outbox) == 2
    assert NewsletterSubscriber.objects.get().status == "pending"


def test_subscribe_without_double_opt_in(api):
    with settings_with(NEWSLETTER_DOUBLE_OPT_IN=False):
        res = api.post("/api/marketing/newsletter/subscribe", {"email": "b@example.com"})
    assert res.json() == {"confirmation_required": False}
    sub = NewsletterSubscriber.objects.get()
    assert sub.status == "subscribed"
    assert sub.confirmed_at is not None
    assert mail.outbox == []


def test_signed_in_user_with_verified_email_skips_confirmation(auth_api, user):
    res = auth_api.post("/api/marketing/newsletter/subscribe", {"email": user.email})
    assert res.json() == {"confirmation_required": False}
    sub = NewsletterSubscriber.objects.get()
    assert sub.status == "subscribed"
    assert sub.user_id == user.pk


def test_subscribe_validation(api):
    res = api.post("/api/marketing/newsletter/subscribe", {"email": "nope"})
    assert res.status_code == 400
    assert "email" in res.json()["error"]["fields"]


def test_confirm_rejects_bad_token(api):
    res = api.post("/api/marketing/newsletter/confirm", {"token": "garbage"})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_token"


def test_confirm_token_cannot_unsubscribe(api):
    api.post("/api/marketing/newsletter/subscribe", {"email": "c@example.com"})
    token = link_token(mail.outbox[0])
    res = api.post("/api/marketing/newsletter/unsubscribe", {"token": token})
    assert res.json()["error"]["code"] == "invalid_token"


def test_unsubscribe(api):
    sub = NewsletterSubscriber.objects.create(email="d@example.com", status="subscribed")
    url = services.unsubscribe_url(sub)
    assert url.startswith("http://app.test/newsletter/unsubscribe?token=")
    token = url.split("token=", 1)[1]
    res = api.post("/api/marketing/newsletter/unsubscribe", {"token": token})
    assert res.json() == {"email": "d@example.com", "status": "unsubscribed"}
    sub.refresh_from_db()
    assert sub.unsubscribed_at is not None
    # Idempotent.
    assert api.post("/api/marketing/newsletter/unsubscribe", {"token": token}).status_code == 200


def test_subscribe_is_throttled(api):
    for i in range(5):
        assert (
            api.post("/api/marketing/newsletter/subscribe", {"email": f"t{i}@example.com"}).status_code == 202
        )
    res = api.post("/api/marketing/newsletter/subscribe", {"email": "t9@example.com"})
    assert res.status_code == 429


def test_subscribe_requires_csrf():
    client = APIClient(enforce_csrf_checks=True)
    res = client.post("/api/marketing/newsletter/subscribe", {"email": "e@example.com"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"


# Contact


def test_contact_stores_and_emails_recipients(api):
    with settings_with(CONTACT_RECIPIENTS=["team@example.com"]):
        res = api.post("/api/marketing/contact", CONTACT, HTTP_USER_AGENT="Browser/1.0")
    assert res.status_code == 201, res.content
    assert res.json() == {"received": True}
    msg = ContactMessage.objects.get()
    assert msg.status == "new"
    assert msg.email == "grace@example.com"
    assert msg.ip == "127.0.0.1"
    assert msg.user_agent == "Browser/1.0"
    assert len(mail.outbox) == 1
    sent = mail.outbox[0]
    assert sent.to == ["team@example.com"]
    assert sent.reply_to == ["grace@example.com"]
    assert "Hello" in sent.subject
    assert "I would like a demo please." in sent.body


def test_contact_falls_back_to_staff(api, staff, make_user):
    make_user(email="former@example.com", is_staff=True, is_active=False)
    api.post("/api/marketing/contact", CONTACT)
    assert mail.outbox[0].to == [staff.email]


def test_contact_text_is_not_html_escaped(api, staff):
    api.post("/api/marketing/contact", {**CONTACT, "message": "Tom & Jerry's <plan> is great"})
    assert "Tom & Jerry's <plan> is great" in mail.outbox[0].body


def test_contact_honeypot(api, staff):
    res = api.post("/api/marketing/contact", {**CONTACT, "website": "http://spam.example"})
    assert res.status_code == 201
    assert res.json() == {"received": True}
    assert ContactMessage.objects.get().status == "spam"
    assert mail.outbox == []


def test_contact_validates_message_length(api):
    short = api.post("/api/marketing/contact", {**CONTACT, "message": "hi"})
    assert short.status_code == 400
    assert short.json()["error"]["fields"]["message"][0]["code"] == "min_length"
    long = api.post("/api/marketing/contact", {**CONTACT, "message": "x" * 5001})
    assert long.json()["error"]["fields"]["message"][0]["code"] == "max_length"
    assert ContactMessage.objects.count() == 0


def test_contact_links_signed_in_user(auth_api, user):
    auth_api.post("/api/marketing/contact", CONTACT)
    assert ContactMessage.objects.get().user_id == user.pk


def test_contact_is_throttled(api):
    for _ in range(5):
        assert api.post("/api/marketing/contact", CONTACT).status_code == 201
    assert api.post("/api/marketing/contact", CONTACT).status_code == 429


# Waitlist


def _join(api, email, ref=None):
    data = {"email": email}
    if ref:
        data["ref"] = ref
    res = api.post("/api/marketing/waitlist", data)
    assert res.status_code == 200, res.content
    return res.json()


def test_waitlist_join_is_idempotent(api):
    first = _join(api, "w1@example.com")
    assert first["position"] == 1
    assert first["referrals"] == 0
    assert first["invited"] is False
    assert len(first["referral_code"]) == 8
    assert _join(api, "W1@example.com") == first
    assert WaitlistEntry.objects.count() == 1


def test_waitlist_positions_and_referrals(api):
    a = _join(api, "a@example.com")
    _join(api, "b@example.com")
    _join(api, "c@example.com")
    cache_clear()
    d = _join(api, "d@example.com")
    assert d["position"] == 4
    # Two people join with d's code (lowercase works too): d moves up 2 * 5 places, capped at 1.
    _join(api, "e@example.com", d["referral_code"].lower())
    cache_clear()
    _join(api, "f@example.com", d["referral_code"])
    status = api.get(f"/api/marketing/waitlist/{d['referral_code']}").json()
    assert status == {"position": 1, "referrals": 2}
    assert api.get(f"/api/marketing/waitlist/{a['referral_code']}").json() == {"position": 1, "referrals": 0}
    f = WaitlistEntry.objects.get(email="f@example.com")
    assert f.referred_by.email == "d@example.com"


def test_waitlist_unknown_ref_is_ignored(api):
    res = _join(api, "x@example.com", "NOPE1234")
    assert res["position"] == 1
    assert WaitlistEntry.objects.get().referred_by is None


def test_waitlist_position_formula():
    entries = [services.create_waitlist_entry(f"p{i}@example.com") for i in range(12)]
    last = entries[-1]
    assert services.waitlist_position(last) == 12
    services.create_waitlist_entry("r@example.com", referred_by=last)
    assert services.waitlist_position(last) == 12 - 5
    with settings_with(WAITLIST_REFERRAL_BONUS=2):
        assert services.waitlist_position(last) == 12 - 2
    # Invited people leave the line.
    WaitlistEntry.objects.filter(pk__in=[e.pk for e in entries[:3]]).update(invited_at="2026-01-01T00:00:00Z")
    assert services.waitlist_position(last) == 9 - 5
    entries[0].refresh_from_db()
    assert services.waitlist_position(entries[0]) == 0


def test_waitlist_status_unknown_code(api):
    assert api.get("/api/marketing/waitlist/ZZZZZZZZ").status_code == 404


# Staff


def cache_clear():
    from django.core.cache import cache

    cache.clear()


@pytest.fixture
def staff_api(staff):
    client = APIClient()
    client.force_authenticate(staff)
    return client


STAFF_GETS = [
    "/api/marketing/subscribers",
    "/api/marketing/subscribers/export",
    "/api/marketing/contact-messages",
    "/api/marketing/waitlist",
]


@pytest.mark.parametrize("url", STAFF_GETS)
def test_staff_endpoints_require_staff(api, auth_api, url):
    assert APIClient().get(url).status_code == 401
    assert auth_api.get(url).status_code == 403


def test_staff_writes_require_staff(auth_api):
    msg = ContactMessage.objects.create(name="a", email="a@example.com", message="0123456789")
    entry = services.create_waitlist_entry("w@example.com")
    assert auth_api.patch(f"/api/marketing/contact-messages/{msg.pk}", {"status": "read"}).status_code == 403
    assert auth_api.post(f"/api/marketing/waitlist/{entry.pk}/invite").status_code == 403
    entry.refresh_from_db()
    assert entry.invited_at is None


def test_subscriber_list_filters(staff_api):
    NewsletterSubscriber.objects.create(email="one@example.com", status="subscribed", source="footer")
    NewsletterSubscriber.objects.create(email="two@example.com", status="pending", source="blog")
    NewsletterSubscriber.objects.create(email="three@other.com", status="subscribed", source="blog")
    res = staff_api.get("/api/marketing/subscribers")
    assert res.json()["count"] == 3
    assert staff_api.get("/api/marketing/subscribers?status=subscribed").json()["count"] == 2
    assert staff_api.get("/api/marketing/subscribers?source=blog").json()["count"] == 2
    found = staff_api.get("/api/marketing/subscribers?search=other").json()["results"]
    assert [r["email"] for r in found] == ["three@other.com"]
    ordered = staff_api.get("/api/marketing/subscribers?ordering=email").json()["results"]
    assert [r["email"] for r in ordered] == ["one@example.com", "three@other.com", "two@example.com"]
    assert (
        staff_api.get("/api/marketing/subscribers?ordering=status").json()["error"]["code"]
        == "invalid_ordering"
    )


def test_subscriber_export_csv(staff_api):
    NewsletterSubscriber.objects.create(email="one@example.com", status="subscribed", source="=HYPERLINK()")
    NewsletterSubscriber.objects.create(email="two@example.com", status="pending")
    NewsletterSubscriber.objects.create(email="three@example.com", status="unsubscribed")
    res = staff_api.get("/api/marketing/subscribers/export")
    assert res.status_code == 200
    assert res["Content-Type"].startswith("text/csv")
    assert "attachment" in res["Content-Disposition"]
    rows = list(csv.reader(io.StringIO(res.content.decode())))
    assert rows[0] == ["email", "locale", "source", "confirmed_at", "created_at"]
    assert [r[0] for r in rows[1:]] == ["one@example.com"]
    assert rows[1][2] == "'=HYPERLINK()"


def test_contact_messages_staff(staff_api, api):
    api.post("/api/marketing/contact", CONTACT)
    api.post("/api/marketing/contact", {**CONTACT, "name": "Bot", "website": "x"})
    res = staff_api.get("/api/marketing/contact-messages")
    assert res.json()["count"] == 2
    assert staff_api.get("/api/marketing/contact-messages?status=spam").json()["results"][0]["name"] == "Bot"
    found = staff_api.get("/api/marketing/contact-messages?search=Hello").json()
    assert found["count"] == 2
    msg = ContactMessage.objects.get(name="Grace")
    res = staff_api.patch(f"/api/marketing/contact-messages/{msg.pk}", {"status": "archived"})
    assert res.status_code == 200
    assert res.json()["status"] == "archived"
    bad = staff_api.patch(f"/api/marketing/contact-messages/{msg.pk}", {"status": "deleted"})
    assert bad.status_code == 400
    missing = staff_api.patch("/api/marketing/contact-messages/000000000000000000000000", {"status": "read"})
    assert missing.status_code == 404


def test_waitlist_staff_list_and_invite(staff_api):
    a = services.create_waitlist_entry("a@example.com")
    services.create_waitlist_entry("b@example.com", referred_by=a)
    res = staff_api.get("/api/marketing/waitlist?ordering=-email")
    body = res.json()
    assert body["count"] == 2
    assert [r["email"] for r in body["results"]] == ["b@example.com", "a@example.com"]
    assert body["results"][1]["referrals"] == 1
    assert staff_api.get("/api/marketing/waitlist?search=b@").json()["count"] == 1

    res = staff_api.post(f"/api/marketing/waitlist/{a.pk}/invite")
    assert res.status_code == 200
    assert res.json()["invited_at"] is not None
    assert mail.outbox[0].to == ["a@example.com"]
    assert "http://app.test/" in mail.outbox[0].body
    assert services.waitlist_status(WaitlistEntry.objects.get(pk=a.pk))["position"] == 0


def test_waitlist_invite_uses_frontend_path(staff_api):
    entry = services.create_waitlist_entry("a+b@example.com")
    paths = {"WAITLIST_INVITE": "/signup?invite={code}&email={email}"}
    with override_settings(PLEATE={**BASE, "FRONTEND_PATHS": paths}):
        staff_api.post(f"/api/marketing/waitlist/{entry.pk}/invite")
    assert (
        f"http://app.test/signup?invite={entry.referral_code}&email=a%2Bb%40example.com"
        in mail.outbox[0].body
    )


# Export


def test_export_includes_marketing(auth_api, user):
    NewsletterSubscriber.objects.create(email=user.email, status="subscribed")
    NewsletterSubscriber.objects.create(email="else@example.com", status="subscribed")
    ContactMessage.objects.create(name="Ada", email=user.email, message="0123456789 hello")
    ContactMessage.objects.create(name="Ada", email=user.email, message="spam spam spam", status="spam")
    services.create_waitlist_entry(user.email)
    data = auth_api.get("/api/auth/me/export").json()["marketing"]
    assert [n["email"] for n in data["newsletter"]] == [user.email]
    assert len(data["contact_messages"]) == 1
    assert len(data["waitlist"]) == 1
