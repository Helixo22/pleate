from django.apps import AppConfig


class MarketingConfig(AppConfig):
    name = "pleate_backend.marketing"
    label = "pleate_marketing"
    verbose_name = "Marketing"

    def ready(self):
        from pleate_backend.accounts.signals import collect_user_data

        from . import handlers

        collect_user_data.connect(handlers.export_user_data, dispatch_uid="pleate_marketing_export")
