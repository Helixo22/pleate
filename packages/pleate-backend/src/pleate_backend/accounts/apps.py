from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "pleate_backend.accounts"
    label = "pleate_accounts"
    verbose_name = "Accounts"

    def ready(self):
        from django.db.models.signals import post_migrate

        from . import handlers  # noqa: F401

        post_migrate.connect(handlers.ensure_indexes, sender=self)
