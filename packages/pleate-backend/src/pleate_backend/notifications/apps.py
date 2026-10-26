from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = "pleate_backend.notifications"
    label = "pleate_notifications"
    verbose_name = "Notifications"

    def ready(self):
        from django.db.models.signals import post_migrate

        from . import handlers

        post_migrate.connect(handlers.ensure_indexes, sender=self)
