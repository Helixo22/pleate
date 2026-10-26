"""
Helpers for projects that send their own newsletters or manage the waitlist.

    from pleate_backend.marketing.services import unsubscribe_url
    url = unsubscribe_url(subscriber)     # put it in every newsletter you send
"""

import secrets

from django.core import signing
from django.db import IntegrityError
from django.db.models import Q
from django.utils.translation import gettext as _

from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.emails import send_email

from .models import NewsletterSubscriber, WaitlistEntry

CONFIRM_SALT = "pleate.marketing.newsletter.confirm"
UNSUBSCRIBE_SALT = "pleate.marketing.newsletter.unsubscribe"

# No 0/O and 1/I/L, so codes survive being read aloud or typed from a screenshot.
REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
REFERRAL_CODE_LENGTH = 8
DEFAULT_REFERRAL_BONUS = 5


def _payload(subscriber) -> dict:
    return {"id": str(subscriber.pk), "e": subscriber.email}


def confirm_token(subscriber) -> str:
    return signing.dumps(_payload(subscriber), salt=CONFIRM_SALT, compress=True)


def unsubscribe_token(subscriber) -> str:
    return signing.dumps(_payload(subscriber), salt=UNSUBSCRIBE_SALT, compress=True)


def _read(token: str, salt: str, max_age: int | None):
    try:
        payload = signing.loads(token, salt=salt, max_age=max_age)
    except signing.BadSignature:
        return None
    try:
        return NewsletterSubscriber.objects.filter(pk=payload["id"], email=payload["e"]).first()
    except Exception:  # noqa: BLE001  malformed id
        return None


def read_confirm_token(token: str):
    return _read(token, CONFIRM_SALT, pleate_settings.AUTH["EMAIL_TOKEN_MAX_AGE"])


def read_unsubscribe_token(token: str):
    # Unsubscribe links never expire: they live in newsletters people keep for years.
    return _read(token, UNSUBSCRIBE_SALT, None)


def unsubscribe_url(subscriber) -> str:
    """The frontend link that unsubscribes ``subscriber``. Put it in every newsletter."""
    return frontend_url("NEWSLETTER_UNSUBSCRIBE", token=unsubscribe_token(subscriber))


def send_confirmation(subscriber):
    send_email(
        "newsletter_confirm",
        subscriber.email,
        {
            "action_url": frontend_url("NEWSLETTER_CONFIRM", token=confirm_token(subscriber)),
            "action_label": _("Confirm subscription"),
        },
        subscriber.locale or None,
    )


# Waitlist


def referral_bonus() -> int:
    return int(pleate_settings.MARKETING.get("WAITLIST_REFERRAL_BONUS", DEFAULT_REFERRAL_BONUS))


def new_referral_code() -> str:
    return "".join(secrets.choice(REFERRAL_ALPHABET) for _ in range(REFERRAL_CODE_LENGTH))


def create_waitlist_entry(email: str, referred_by=None) -> WaitlistEntry:
    for _attempt in range(8):
        try:
            return WaitlistEntry.objects.create(
                email=email, referral_code=new_referral_code(), referred_by=referred_by
            )
        except IntegrityError:
            existing = WaitlistEntry.objects.filter(email=email).first()
            if existing:
                return existing
    raise RuntimeError("Could not generate a unique referral code.")


def referral_count(entry: WaitlistEntry) -> int:
    return WaitlistEntry.objects.filter(referred_by=entry).count()


def waitlist_position(entry: WaitlistEntry, referrals: int | None = None) -> int:
    """
    ``rank`` is 1 + the number of people still waiting (not invited) who joined
    before ``entry`` (ties broken by id). Each referral moves the entry up by
    ``MARKETING["WAITLIST_REFERRAL_BONUS"]`` places (default 5):

        position = max(1, rank - bonus * referrals)

    Several entries can share a position. Invited entries have position 0.
    """
    if entry.invited_at:
        return 0
    if referrals is None:
        referrals = referral_count(entry)
    ahead = WaitlistEntry.objects.filter(invited_at__isnull=True).filter(
        Q(created_at__lt=entry.created_at) | Q(created_at=entry.created_at, pk__lt=entry.pk)
    )
    rank = ahead.count() + 1
    return max(1, rank - referral_bonus() * referrals)


def waitlist_status(entry: WaitlistEntry) -> dict:
    referrals = referral_count(entry)
    return {
        "position": waitlist_position(entry, referrals),
        "referral_code": entry.referral_code,
        "referrals": referrals,
        "invited": entry.invited_at is not None,
    }


def invite_url(entry: WaitlistEntry) -> str:
    """``FRONTEND_PATHS["WAITLIST_INVITE"]`` (gets ``code`` and ``email``) or the frontend root."""
    if "WAITLIST_INVITE" in pleate_settings.FRONTEND_PATHS:
        from urllib.parse import quote

        return frontend_url("WAITLIST_INVITE", code=entry.referral_code, email=quote(entry.email))
    return pleate_settings.FRONTEND_URL.rstrip("/") + "/"
