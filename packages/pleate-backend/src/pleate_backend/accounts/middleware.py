import time

from django.utils import timezone

from pleate_backend.core.utils import client_ip, user_agent

TOUCH_EVERY = 300


class SessionActivityMiddleware:
    """Keeps ``UserSession.last_seen_at`` and the device info roughly fresh."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        session = getattr(request, "session", None)
        if session is not None:
            session.client_meta = {"ip": client_ip(request), "user_agent": user_agent(request)}
        response = self.get_response(request)
        user = getattr(request, "user", None)
        if session is None or user is None or not user.is_authenticated or not session.session_key:
            return response
        now = int(time.time())
        if now - session.get("_pl_seen", 0) > TOUCH_EVERY:
            from .models import UserSession

            UserSession.objects.filter(session_key=session.session_key).update(
                last_seen_at=timezone.now(), ip=client_ip(request), user_agent=user_agent(request)
            )
            session["_pl_seen"] = now
        return response
