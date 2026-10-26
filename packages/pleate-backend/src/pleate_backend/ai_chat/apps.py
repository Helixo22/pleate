from django.apps import AppConfig


class AiChatConfig(AppConfig):
    name = "pleate_backend.ai_chat"
    label = "pleate_ai_chat"
    verbose_name = "AI chat"

    def ready(self):
        from pleate_backend.accounts.signals import collect_user_data

        from . import handlers

        collect_user_data.connect(handlers.export_user_data, dispatch_uid="pleate_ai_chat_export")
