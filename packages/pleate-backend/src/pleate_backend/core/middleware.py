import re
import uuid

from django.conf import settings
from django.utils import translation

from .logging import request_id_var

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")


class RequestIdMiddleware:
    """Propagates X-Request-ID (or creates one) to logs and the response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming = request.META.get("HTTP_X_REQUEST_ID", "")
        rid = incoming if _REQUEST_ID.match(incoming) else uuid.uuid4().hex
        request.request_id = rid
        token = request_id_var.set(rid)
        try:
            response = self.get_response(request)
        finally:
            request_id_var.reset(token)
        response["X-Request-ID"] = rid
        return response


class LocaleMiddleware:
    """
    Picks the language from, in order: the ``locale`` cookie, the signed in
    user's preference, Accept-Language. The response carries Content-Language.
    """

    cookie_name = "locale"

    def __init__(self, get_response):
        self.get_response = get_response
        self.supported = {code for code, _ in settings.LANGUAGES}

    def _pick(self, request):
        cookie = request.COOKIES.get(self.cookie_name)
        if cookie in self.supported:
            return cookie
        return translation.get_language_from_request(request)

    def __call__(self, request):
        language = self._pick(request)
        translation.activate(language)
        request.LANGUAGE_CODE = translation.get_language()
        response = self.get_response(request)
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and not request.COOKIES.get(self.cookie_name):
            pref = getattr(user, "locale", "")
            if pref in self.supported and pref != request.LANGUAGE_CODE:
                # Applies from the next request on, the user model loads lazily.
                response.set_cookie(self.cookie_name, pref, samesite="Lax", max_age=60 * 60 * 24 * 365)
        response.setdefault("Content-Language", translation.get_language())
        translation.deactivate()
        return response
