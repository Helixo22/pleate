import hashlib

from django.contrib.auth import login
from django.utils import timezone

from pleate_backend.core.conf import pleate_settings
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
