from django.db.models.signals import pre_delete
from django.dispatch import receiver

from pleate_backend.accounts.signals import collect_user_data
from pleate_backend.core.tasks import register_cleanup

from .models import File


@receiver(pre_delete, sender=File, dispatch_uid="pleate_files_delete_blob")
def delete_blob(sender, instance, **kwargs):
    # Runs for single deletes, queryset deletes and the user cascade.
    from .services import delete_blob as _delete

    _delete(instance)


@receiver(collect_user_data, dispatch_uid="pleate_files_export")
def export_files(sender, user, **kwargs):
    files = File.objects.ready().filter(owner=user).order_by("created_at")
    return "files", [
        {
            "id": str(f.pk),
            "name": f.name,
            "size": f.size,
            "content_type": f.content_type,
            "checksum": f.checksum,
            "purpose": f.purpose,
            "created_at": f.created_at.isoformat(),
        }
        for f in files
    ]


@register_cleanup
def cleanup_pending_files():
    from .services import remove_stale_pending

    remove_stale_pending()
