from django.apps import AppConfig


class ApikeysConfig(AppConfig):
    name = "pleate_backend.apikeys"
    label = "pleate_apikeys"
    verbose_name = "API keys"

    def ready(self):
        from . import handlers  # noqa: F401
