"""
Automatic auditing of model changes.

    from pleate_backend import audit
    audit.register(Project)                              # every field
    audit.register(Invoice, fields=["status", "total"])  # only these
    audit.register(Team, exclude=("password", "notes"))

Saves log ``<app_label>.<model>.created|updated|deleted`` with
``changes = {field: [before, after]}``. Sensitive fields (password, secret,
token, key_hash...) are always masked, even when listed in ``fields``.
"""

import logging

from django.db.models.signals import post_delete, post_save, pre_save

from .services import log_activity

logger = logging.getLogger("pleate.audit")

_registry: dict = {}
_BEFORE = "_pleate_audit_before"


def _tracked_fields(model, fields, exclude):
    names = []
    for field in model._meta.concrete_fields:
        if field.primary_key:
            continue
        if fields is not None and field.name not in fields and field.attname not in fields:
            continue
        if field.name in exclude or field.attname in exclude:
            continue
        names.append(field)
    return names


def _snapshot(instance, tracked) -> dict:
    return {field.name: field.value_from_object(instance) for field in tracked}


def _diff(before: dict, after: dict) -> dict:
    return {name: [before.get(name), value] for name, value in after.items() if before.get(name) != value}


def register(model, fields=None, exclude=("password",), action_prefix: str | None = None):
    """Audits saves and deletes of ``model``. Calling it twice replaces the config."""
    opts = model._meta
    prefix = action_prefix or f"{opts.app_label}.{opts.model_name}"
    tracked = _tracked_fields(model, set(fields) if fields is not None else None, set(exclude or ()))
    _registry[model] = {"prefix": prefix, "tracked": tracked}
    uid = f"pleate_audit_{opts.label_lower}"

    def before_save(sender, instance, raw=False, **kwargs):
        if raw:
            return
        try:
            setattr(instance, _BEFORE, None)
            if instance.pk is None or instance._state.adding:
                return
            old = sender._base_manager.filter(pk=instance.pk).first()
            if old is not None:
                setattr(instance, _BEFORE, _snapshot(old, _registry[sender]["tracked"]))
        except Exception:  # noqa: BLE001
            logger.exception("audit snapshot failed for %s", sender)

    def after_save(sender, instance, created, raw=False, **kwargs):
        if raw:
            return
        conf = _registry[sender]
        after = _snapshot(instance, conf["tracked"])
        before = getattr(instance, _BEFORE, None)
        if created or before is None:
            changes = {
                name: [None, value] for name, value in after.items() if value not in (None, "", [], {})
            }
            log_activity(f"{conf['prefix']}.created", target=instance, changes=changes)
            return
        changes = _diff(before, after)
        setattr(instance, _BEFORE, after)
        if changes:
            log_activity(f"{conf['prefix']}.updated", target=instance, changes=changes)

    def after_delete(sender, instance, **kwargs):
        conf = _registry[sender]
        log_activity(f"{conf['prefix']}.deleted", target=instance)

    pre_save.connect(before_save, sender=model, weak=False, dispatch_uid=uid)
    post_save.connect(after_save, sender=model, weak=False, dispatch_uid=uid)
    post_delete.connect(after_delete, sender=model, weak=False, dispatch_uid=uid)
    return model


def unregister(model):
    uid = f"pleate_audit_{model._meta.label_lower}"
    pre_save.disconnect(sender=model, dispatch_uid=uid)
    post_save.disconnect(sender=model, dispatch_uid=uid)
    post_delete.disconnect(sender=model, dispatch_uid=uid)
    _registry.pop(model, None)


def is_registered(model) -> bool:
    return model in _registry
