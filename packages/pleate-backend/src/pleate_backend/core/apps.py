from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "pleate_backend.core"
    label = "pleate_core"
    verbose_name = "pleate core"

    def ready(self):
        from . import schema  # noqa: F401
