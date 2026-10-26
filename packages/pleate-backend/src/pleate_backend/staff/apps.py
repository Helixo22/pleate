from django.apps import AppConfig


class StaffConfig(AppConfig):
    name = "pleate_backend.staff"
    label = "pleate_staff"
    verbose_name = "Back office"

    def ready(self):
        from . import bans  # noqa: F401  (cache invalidation receivers)
