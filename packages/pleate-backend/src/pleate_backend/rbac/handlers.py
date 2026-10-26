from django.dispatch import receiver

from pleate_backend.accounts.signals import user_signed_up

from .services import assign_default_roles


@receiver(user_signed_up, dispatch_uid="pleate_rbac_default_roles")
def give_default_roles(sender, user, **kwargs):
    assign_default_roles(user)
