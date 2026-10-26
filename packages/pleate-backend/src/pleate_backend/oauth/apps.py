from django.apps import AppConfig


class OauthConfig(AppConfig):
    name = "pleate_backend.oauth"
    label = "pleate_oauth"
    verbose_name = "Social sign in"

    def ready(self):
        from pleate_backend.accounts.me import register_me_field
        from pleate_backend.accounts.signals import collect_user_data

        from . import handlers

        register_me_field("oauth_providers", handlers.linked_providers)
        collect_user_data.connect(handlers.export_data, dispatch_uid="pleate_oauth_export")
