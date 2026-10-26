def export_data(sender, user, **kwargs):
    """State and dates only: secrets and code hashes never leave the server."""
    from .models import TOTPDevice

    device = TOTPDevice.objects.filter(user=user, confirmed_at__isnull=False).first()
    if device is None:
        return "mfa", {"enabled": False}
    return "mfa", {
        "enabled": True,
        "created_at": device.created_at.isoformat(),
        "enabled_at": device.confirmed_at.isoformat(),
    }
