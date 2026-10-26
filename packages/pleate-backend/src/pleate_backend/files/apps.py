from django.apps import AppConfig


class FilesConfig(AppConfig):
    name = "pleate_backend.files"
    label = "pleate_files"
    verbose_name = "Files"

    def ready(self):
        from . import handlers  # noqa: F401
