from django.apps import AppConfig


class AuditConfig(AppConfig):
    name = "pleate_backend.audit"
    label = "pleate_audit"
    verbose_name = "Activity log"

    def ready(self):
        from django.db.models.signals import post_migrate

        from . import handlers

        handlers.connect()
        post_migrate.connect(handlers.ensure_indexes, sender=self)
