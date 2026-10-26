"""
Roles, object permissions and feature flags.

    from pleate_backend.rbac import services as rbac

    rbac.assign_role(user, "editor")
    rbac.has_role(user, "editor")
    rbac.grant(user, "projects.change_project", project)
    rbac.grant(group, "projects.view_project", project)
    user.has_perm("projects.change_project", project)    # through ObjectPermissionBackend
    rbac.users_with_perm("projects.view_project", project)
    rbac.feature_enabled(user, "new-dashboard")
"""

import hashlib

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType

from .models import Feature, ObjectPermission, RoleInfo


def perm_name(permission) -> str:
    """``Permission`` instance to its "app_label.codename" string."""
    return f"{permission.content_type.app_label}.{permission.codename}"


def _check_perm(perm: str) -> str:
    if not isinstance(perm, str) or perm.count(".") != 1 or not all(perm.split(".")):
        raise ValueError(f'Permissions are "app_label.codename" strings, got {perm!r}.')
    return perm


def _target(obj) -> tuple[ContentType, str]:
    return ContentType.objects.get_for_model(obj), str(obj.pk)


def _holder(user_or_group) -> dict:
    if isinstance(user_or_group, Group):
        return {"group": user_or_group, "user": None}
    return {"user": user_or_group, "group": None}


def _clear_perm_cache(user_or_group):
    for attr in ("_perm_cache", "_user_perm_cache", "_group_perm_cache", "_pleate_obj_perm_cache"):
        if hasattr(user_or_group, attr):
            delattr(user_or_group, attr)


# Object permissions


def grant(user_or_group, perm: str, obj) -> ObjectPermission:
    """Give ``perm`` on ``obj`` to a user or a group. Idempotent."""
    content_type, object_id = _target(obj)
    holder = _holder(user_or_group)
    row = ObjectPermission.objects.filter(
        permission=_check_perm(perm), content_type=content_type, object_id=object_id, **holder
    ).first()
    if row is None:
        row = ObjectPermission.objects.create(
            permission=perm, content_type=content_type, object_id=object_id, **holder
        )
    _clear_perm_cache(user_or_group)
    return row


def revoke(user_or_group, perm: str, obj) -> int:
    """Remove ``perm`` on ``obj`` from a user or a group. Returns how many grants were removed."""
    content_type, object_id = _target(obj)
    deleted, _ = ObjectPermission.objects.filter(
        permission=_check_perm(perm), content_type=content_type, object_id=object_id, **_holder(user_or_group)
    ).delete()
    _clear_perm_cache(user_or_group)
    return deleted


def clear_object_permissions(obj) -> int:
    """Delete every grant on ``obj``. Call it when the object is deleted."""
    content_type, object_id = _target(obj)
    deleted, _ = ObjectPermission.objects.filter(content_type=content_type, object_id=object_id).delete()
    return deleted


def group_ids(user) -> list:
    return list(user.groups.values_list("pk", flat=True))


def object_permissions(user, obj) -> set[str]:
    """Permissions the user holds on ``obj`` directly or through its groups (no global perms)."""
    if not user or not user.is_authenticated or not user.is_active or obj is None or obj.pk is None:
        return set()
    content_type, object_id = _target(obj)
    key = (content_type.pk, object_id)
    cache = user.__dict__.setdefault("_pleate_obj_perm_cache", {})
    if key not in cache:
        rows = ObjectPermission.objects.filter(content_type=content_type, object_id=object_id)
        direct = set(rows.filter(user=user).values_list("permission", flat=True))
        groups = group_ids(user)
        via_groups = (
            set(rows.filter(group__in=groups).values_list("permission", flat=True)) if groups else set()
        )
        cache[key] = direct | via_groups
    return cache[key]


def users_with_perm(perm: str, obj):
    """Users that hold ``perm`` on ``obj`` directly or through a group. Global perms are not included."""
    User = get_user_model()
    content_type, object_id = _target(obj)
    rows = ObjectPermission.objects.filter(
        permission=_check_perm(perm), content_type=content_type, object_id=object_id
    )
    user_ids = {uid for uid in rows.values_list("user_id", flat=True) if uid}
    group_pks = [gid for gid in rows.values_list("group_id", flat=True) if gid]
    if group_pks:
        through = User.groups.through
        user_ids |= set(through.objects.filter(group_id__in=group_pks).values_list("user_id", flat=True))
    return User.objects.filter(pk__in=list(user_ids), is_active=True)


# Roles


def permissions_by_group(group_pks) -> dict:
    """{group_pk: sorted ["app_label.codename", ...]} in two queries (no prefetch on MongoDB)."""
    from django.contrib.auth.models import Permission

    through = Group.permissions.through
    pairs = list(
        through.objects.filter(group_id__in=list(group_pks)).values_list("group_id", "permission_id")
    )
    perms = {
        p.pk: perm_name(p)
        for p in Permission.objects.select_related("content_type").filter(pk__in=[pid for _g, pid in pairs])
    }
    out: dict = {pk: [] for pk in group_pks}
    for gid, pid in pairs:
        if pid in perms:
            out.setdefault(gid, []).append(perms[pid])
    return {gid: sorted(names) for gid, names in out.items()}


def roles_by_user(user_pks) -> dict:
    """{user_pk: sorted role names} in two queries."""
    User = get_user_model()
    pairs = list(
        User.groups.through.objects.filter(user_id__in=list(user_pks)).values_list("user_id", "group_id")
    )
    names = dict(Group.objects.filter(pk__in=[gid for _u, gid in pairs]).values_list("pk", "name"))
    out: dict = {pk: [] for pk in user_pks}
    for uid, gid in pairs:
        if gid in names:
            out.setdefault(uid, []).append(names[gid])
    return {uid: sorted(roles) for uid, roles in out.items()}


def role_names(user) -> list[str]:
    if not user or not user.is_authenticated:
        return []
    return sorted(user.groups.values_list("name", flat=True))


def has_role(user, name: str) -> bool:
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name=name).exists()


def assign_role(user, name: str) -> Group:
    """Add the user to the role. Raises ``Group.DoesNotExist`` for unknown roles."""
    group = Group.objects.get(name=name)
    user.groups.add(group)
    _clear_perm_cache(user)
    return group


def remove_role(user, name: str) -> None:
    group = Group.objects.filter(name=name).first()
    if group:
        user.groups.remove(group)
        _clear_perm_cache(user)


def set_roles(user, names: list[str]) -> None:
    """Replace the user's roles. Raises ``Group.DoesNotExist`` when a name is unknown."""
    groups = list(Group.objects.filter(name__in=names))
    if len(groups) != len(set(names)):
        raise Group.DoesNotExist
    user.groups.set(groups)
    _clear_perm_cache(user)


def assign_default_roles(user) -> list[str]:
    groups = list(
        Group.objects.filter(
            pk__in=list(RoleInfo.objects.filter(is_default=True).values_list("group_id", flat=True))
        )
    )
    if groups:
        user.groups.add(*groups)
        _clear_perm_cache(user)
    return [g.name for g in groups]


def global_permissions(user) -> list[str]:
    if not user or not user.is_authenticated:
        return []
    return sorted(user.get_all_permissions())


# Feature flags


def rollout_bucket(key: str, user_id) -> int:
    """0..99, stable for a (flag, user) pair, independent between flags."""
    digest = hashlib.sha256(f"{key}:{user_id}".encode()).hexdigest()
    return int(digest[:8], 16) % 100


def _feature_on(feature: Feature, user, listed: set, via_group: set) -> bool:
    if feature.enabled:
        return True
    if not user or not user.is_authenticated:
        return False
    if feature.pk in listed or feature.pk in via_group:
        return True
    return feature.rollout_percent > 0 and rollout_bucket(feature.key, user.pk) < feature.rollout_percent


def _memberships(user, feature_ids=None) -> tuple[set, set]:
    if not user or not user.is_authenticated:
        return set(), set()
    users_through = Feature.users.through.objects.filter(user_id=user.pk)
    groups = group_ids(user)
    groups_through = Feature.groups.through.objects.filter(group_id__in=groups) if groups else None
    if feature_ids is not None:
        users_through = users_through.filter(feature_id__in=feature_ids)
        if groups_through is not None:
            groups_through = groups_through.filter(feature_id__in=feature_ids)
    listed = set(users_through.values_list("feature_id", flat=True))
    via_group = (
        set(groups_through.values_list("feature_id", flat=True)) if groups_through is not None else set()
    )
    return listed, via_group


def feature_enabled(user, key: str) -> bool:
    """Unknown flags are off."""
    feature = Feature.objects.filter(key=key).first()
    if feature is None:
        return False
    if feature.enabled:
        return True
    listed, via_group = _memberships(user, [feature.pk])
    return _feature_on(feature, user, listed, via_group)


def enabled_features(user) -> list[str]:
    features = list(Feature.objects.only("pk", "key", "enabled", "rollout_percent"))
    if not features:
        return []
    listed, via_group = _memberships(user)
    return sorted(f.key for f in features if _feature_on(f, user, listed, via_group))
