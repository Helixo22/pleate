def linked_providers(user) -> list[str]:
    from .models import SocialAccount

    return sorted(set(SocialAccount.objects.filter(user=user).values_list("provider", flat=True)))


def export_data(sender, user, **kwargs):
    from .models import SocialAccount

    rows = SocialAccount.objects.filter(user=user).order_by("created_at")
    return "oauth", [
        {
            "provider": row.provider,
            "uid": row.uid,
            "email": row.email,
            "created_at": row.created_at.isoformat(),
            "last_login_at": row.last_login_at.isoformat() if row.last_login_at else None,
        }
        for row in rows
    ]
