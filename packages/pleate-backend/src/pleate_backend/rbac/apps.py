from django.apps import AppConfig


class RbacConfig(AppConfig):
    name = "pleate_backend.rbac"
    label = "pleate_rbac"
    verbose_name = "Roles and permissions"

    def ready(self):
        from pleate_backend.accounts.me import register_me_field

        from . import handlers  # noqa: F401
        from .services import enabled_features, global_permissions, role_names

        register_me_field("roles", role_names)
        register_me_field("permissions", global_permissions)
        register_me_field("features", enabled_features)
