from django.apps import AppConfig


class WebhooksConfig(AppConfig):
    name = "pleate_backend.webhooks"
    label = "pleate_webhooks"
    verbose_name = "Webhooks"

    def ready(self):
        from django.db.models.signals import post_migrate

        from . import handlers, registry  # noqa: F401

        handlers.connect()
        post_migrate.connect(handlers.ensure_indexes, sender=self)
