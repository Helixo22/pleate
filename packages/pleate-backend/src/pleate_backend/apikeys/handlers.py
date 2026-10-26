from django.dispatch import receiver

from pleate_backend.accounts.signals import collect_user_data


@receiver(collect_user_data, dispatch_uid="pleate_apikeys_export")
def export_keys(sender, user, **kwargs):
    from .models import APIKey

    return "api_keys", [
        {
            "name": key.name,
            "prefix": key.prefix,
            "scopes": key.scopes,
            "status": key.status,
            "created_at": key.created_at.isoformat(),
            "expires_at": key.expires_at.isoformat() if key.expires_at else None,
            "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
            "revoked_at": key.revoked_at.isoformat() if key.revoked_at else None,
        }
        for key in APIKey.objects.filter(user=user)
    ]
