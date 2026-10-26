from django.apps import AppConfig


class MfaConfig(AppConfig):
    name = "pleate_backend.mfa"
    label = "pleate_mfa"
    verbose_name = "Two factor authentication"

    def ready(self):
        from pleate_backend.accounts import services as account_services
        from pleate_backend.accounts.me import register_me_field
        from pleate_backend.accounts.signals import collect_user_data

        from . import handlers, services

        if services.login_challenge not in account_services.login_challenges:
            account_services.login_challenges.append(services.login_challenge)
        register_me_field("mfa_enabled", services.is_enabled)
        collect_user_data.connect(handlers.export_data, dispatch_uid="pleate_mfa_export")
