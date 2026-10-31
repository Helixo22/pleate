from django.apps import apps

from pleate_backend.core.conf import pleate_settings

TYPES = {
    "files": "pleate_backend.files",
    "conversations": "pleate_backend.ai_chat",
    "notifications": "pleate_backend.notifications",
}


def available_types() -> list[str]:
    return [name for name, app in TYPES.items() if apps.is_installed(app)]


def _path(key: str, **params) -> str:
    return pleate_settings.FRONTEND_PATHS[key].format(**params)


def _safe_link(url: str) -> str | None:
    """A frontend path or an http(s) URL; anything else (javascript:, //host) is dropped."""
    if url.startswith("/") and not url.startswith("//") and "\\" not in url:
        return url
    return url if url.lower().startswith(("https://", "http://")) else None


def _files(user, q, limit):
    from pleate_backend.files.models import File

    rows = File.objects.ready().filter(owner=user, name__icontains=q).order_by("-created_at")[:limit]
    return [
        {
            "type": "files",
            "id": str(f.pk),
            "title": f.name,
            "subtitle": f.content_type,
            "url": _path("FILE", id=f.pk),
        }
        for f in rows
    ]


def _conversations(user, q, limit):
    from pleate_backend.ai_chat.models import Conversation

    rows = Conversation.objects.filter(user=user, title__icontains=q).order_by("-last_message_at")[:limit]
    return [
        {
            "type": "conversations",
            "id": str(c.pk),
            "title": c.title,
            "subtitle": None,
            "url": _path("CONVERSATION", id=c.pk),
        }
        for c in rows
    ]


def _notifications(user, q, limit):
    from pleate_backend.notifications.models import Notification

    rows = Notification.objects.filter(user=user, title__icontains=q).order_by("-created_at")[:limit]
    return [
        {
            "type": "notifications",
            "id": str(n.pk),
            "title": n.title,
            "subtitle": n.body[:120] or None,
            "url": _safe_link(n.url) or _path("NOTIFICATIONS"),
        }
        for n in rows
    ]


SEARCHERS = {"files": _files, "conversations": _conversations, "notifications": _notifications}


def search(user, q: str, types: list[str], limit: int) -> list[dict]:
    """``icontains`` is escaped by the ORM: ``q`` is matched literally, never as a regex."""
    results = []
    for name in types:
        results.extend(SEARCHERS[name](user, q, limit))
    return results
