"""
Mount everything with ``path("api/", include("pleate_backend.urls"))``.

Each installed pleate app contributes its routes under its own prefix. The
OpenAPI schema is served at ``schema`` and a Swagger UI at ``docs``.
"""

from importlib import import_module

from django.apps import apps
from django.urls import URLPattern, include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

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
}

urlpatterns = [
    path("schema", SpectacularAPIView.as_view(), name="schema"),
    path("docs", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
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
