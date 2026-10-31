import hashlib

from django.conf import settings
from django.contrib.auth import login
from django.utils import timezone
from django.utils.translation import gettext as _

from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.utils import client_ip, user_agent

# Callables ``(request, user, remember) -> dict | None``. A non None result
# stops the login and is returned to the client (for example a 2FA challenge).
login_challenges: list = []

BACKEND = "pleate_backend.accounts.backends.EmailBackend"


def complete_login(request, user, remember: bool = False):
    """Creates the session. Used by password login, 2FA and OAuth."""
    login(request, user, backend=BACKEND)
    session = request.session
    session.set_expiry(pleate_settings.AUTH["REMEMBER_ME_AGE"] if remember else 0)
    session.client_meta = {"ip": client_ip(request), "user_agent": user_agent(request)}
    session.save()
    from .models import UserSession

    UserSession.objects.filter(session_key=session.session_key).update(
        user=user, ip=client_ip(request), user_agent=user_agent(request), last_seen_at=timezone.now()
    )


def send_password_reset(user, language: str):
    from pleate_backend.emails import send_email

    from .tokens import make_reset_token

    send_email(
        "password_reset",
        user.email,
        {
            "name": user.display_name,
            "action_url": frontend_url("RESET_PASSWORD", token=make_reset_token(user)),
            "action_label": _("Choose a new password"),
            "minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
        },
        language,
    )


def public_session_id(session_key: str) -> str:
    """Sessions are listed by a hash: the key itself is the cookie secret."""
    return hashlib.sha256(session_key.encode()).hexdigest()[:24]


def revoke_sessions(user, keep: str | None = None) -> int:
    from .models import UserSession

    qs = UserSession.objects.filter(user=user)
    if keep:
        qs = qs.exclude(session_key=keep)
    count = qs.count()
    qs.delete()
    return count


def revoke_credentials(user, *, unverified: bool = False):
    """
    After a password change or reset: revokes every API key. ``unverified`` (a
    reset of an account whose email was never confirmed) also deletes what
    someone may have attached before the owner proved the inbox: social links,
    2FA and webhook endpoints. Apps that are not installed are skipped.
    """
    from django.apps import apps

    def model(name):
        try:
            return apps.get_model(name)
        except LookupError:
            return None

    if keys := model("pleate_apikeys.APIKey"):
        keys.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
    if not unverified:
        return
    for name, field in (
        ("pleate_oauth.SocialAccount", "user"),
        ("pleate_mfa.TOTPDevice", "user"),
        ("pleate_mfa.BackupCode", "user"),
        ("pleate_webhooks.Endpoint", "owner"),
    ):
        if cls := model(name):
            cls.objects.filter(**{field: user}).delete()


def describe_user_agent(ua: str) -> dict:
    ua_l = ua.lower()
    browser = next(
        (
            name
            for key, name in (
                ("edg/", "Edge"),
                ("opr/", "Opera"),
                ("firefox/", "Firefox"),
                ("chrome/", "Chrome"),
                ("safari/", "Safari"),
            )
            if key in ua_l
        ),
        "Unknown browser",
    )
    os_name = next(
        (
            name
            for key, name in (
                ("iphone", "iOS"),
                ("ipad", "iPadOS"),
                ("android", "Android"),
                ("mac os x", "macOS"),
                ("windows", "Windows"),
                ("linux", "Linux"),
            )
            if key in ua_l
        ),
        "Unknown OS",
    )
    mobile = any(k in ua_l for k in ("iphone", "android", "mobile"))
    return {"browser": browser, "os": os_name, "mobile": mobile}


# UI preferences (/auth/me/preferences), kept in User.preferences next to any free form keys.


def ui_preferences(user) -> dict:
    stored = user.preferences or {}
    return {
        "theme": stored.get("theme", "system"),
        "palette": stored.get("palette"),
        "motion": stored.get("motion", "system"),
        "bottom_bar": list(stored.get("bottom_bar") or []),
    }


def update_ui_preferences(user, changes: dict) -> dict:
    from .serializers import PREFERENCES_MAX_CHARS

    merged = {**(user.preferences or {}), **changes}
    if len(str(merged)) > PREFERENCES_MAX_CHARS:
        raise ApiError("preferences_too_large", _("Preferences must be a small object."), 400)
    user.preferences = merged
    user.save(update_fields=["preferences"])
    return ui_preferences(user)
