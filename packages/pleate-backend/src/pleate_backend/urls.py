"""
Mount everything with ``path("api/", include("pleate_backend.urls"))``.

Each installed pleate app contributes its routes under its own prefix. The
OpenAPI schema is served at ``schema`` and a Swagger UI at ``docs``: open in
DEBUG, otherwise limited by ``SPECTACULAR_SETTINGS["SERVE_PERMISSIONS"]``
(staff by default).
"""

from importlib import import_module

from django.apps import apps
from django.conf import settings
from django.urls import URLPattern, include, path
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny

PREFIXES = {
    "pleate_backend.core": "",
    "pleate_backend.accounts": "auth/",
    "pleate_backend.mfa": "auth/mfa/",
    "pleate_backend.oauth": "auth/oauth/",
    "pleate_backend.rbac": "rbac/",
    "pleate_backend.apikeys": "api-keys/",
    "pleate_backend.files": "files/",
    "pleate_backend.notifications": "notifications/",
    "pleate_backend.audit": "activity/",
    "pleate_backend.webhooks": "webhooks/",
    "pleate_backend.ai_chat": "ai/",
    "pleate_backend.marketing": "marketing/",
    "pleate_backend.billing": "billing/",
    "pleate_backend.staff": "staff/",
    "pleate_backend.usage": "usage/",
    "pleate_backend.search": "search/",
}


class SchemaView(SpectacularAPIView):
    # Decorating get (not dispatch) caches only after DRF checked the permissions.
    @extend_schema(exclude=True)
    @method_decorator(cache_page(60 * 10))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


docs_access = {"permission_classes": [AllowAny]} if settings.DEBUG else {}

urlpatterns = [
    path("schema", SchemaView.as_view(**docs_access), name="schema"),
    path("docs", SpectacularSwaggerView.as_view(url_name="schema", **docs_access), name="swagger"),
]

for module, prefix in PREFIXES.items():
    if not apps.is_installed(module):
        continue
    urls = import_module(f"{module}.urls")
    if prefix:
        # The app's root route ("") is also reachable without the trailing
        # slash, so every collection is /api/files, /api/api-keys...
        for pattern in urls.urlpatterns:
            if isinstance(pattern, URLPattern) and str(pattern.pattern) == "":
                name = f"{urls.app_name}-root" if getattr(urls, "app_name", None) else None
                urlpatterns.append(path(prefix.rstrip("/"), pattern.callback, name=name))
    urlpatterns.append(path(prefix, include(f"{module}.urls")))
