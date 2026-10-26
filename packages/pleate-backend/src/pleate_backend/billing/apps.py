from django.apps import AppConfig


class BillingConfig(AppConfig):
    name = "pleate_backend.billing"
    label = "pleate_billing"
    verbose_name = "Billing"

    def ready(self):
        from django.conf import settings
        from django.db.models.signals import pre_delete

        from pleate_backend.accounts.me import register_me_field
        from pleate_backend.accounts.signals import collect_user_data

        from . import handlers, services

        register_me_field("subscription", services.me_field)
        collect_user_data.connect(handlers.export_user_data, dispatch_uid="pleate_billing_export")
        pre_delete.connect(
            handlers.cancel_on_delete, sender=settings.AUTH_USER_MODEL, dispatch_uid="pleate_billing_cancel"
        )
