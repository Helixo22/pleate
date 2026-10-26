"""
Roles, object level permissions and feature flags.

Roles are standard Django auth ``Group`` objects with a ``RoleInfo`` row
(``description``, ``is_default``). Default roles are given to every account on
signup (``accounts.signals.user_signed_up``). Global permissions keep working
through Django's ModelBackend; ``ObjectPermissionBackend`` adds permissions on
single objects, held by a user directly or through one of its roles.

Endpoints (mounted at ``/api/rbac/``). Role and permission endpoints need
``is_staff`` or the ``auth.change_group`` permission; flag CRUD needs
``is_staff`` or the matching ``pleate_rbac.*_feature`` permission.

    GET    roles                      page list, ?search=name, ?ordering=name
    POST   roles                      {name, description?, is_default?, permissions?: ["app.codename"]}
    GET    roles/<id>                 {id, name, description, is_default, permissions}
    PATCH  roles/<id>                 any of the fields above (permissions replaces the set)
    DELETE roles/<id>                 204, also removes the role's object grants
    GET    permissions                every permission, page list, ?search= (codename, name, app, model)
                                      items {id, codename: "app.codename", name, app_label, model}
    POST   users/<user_id>/roles      {role} -> {roles: [names]}
    DELETE users/<user_id>/roles      {role} in the body or ?role= -> {roles: [names]}
    GET    features/me                {features: [keys]} enabled for the signed in user
    GET    features                   page list, ?search=, ?enabled=,
                                      ?ordering=key,created_at,updated_at,rollout_percent
    POST   features                   {key, description?, enabled?, rollout_percent? 0..100,
                                       users?: [ids], groups?: [role names]}
    GET    features/<id>
    PATCH  features/<id>
    DELETE features/<id>

Error codes: ``role_taken``, ``unknown_permission``, ``unknown_role``,
``unknown_user``, ``feature_taken``, ``feature_disabled``.

``/auth/me`` gains ``extra.roles`` (role names), ``extra.permissions`` (sorted
global "app.codename" permissions) and ``extra.features`` (enabled flag keys).

Helpers (``pleate_backend.rbac.services``)::

    grant(user_or_group, "app.codename", obj)      revoke(user_or_group, "app.codename", obj)
    users_with_perm("app.codename", obj)           clear_object_permissions(obj)
    has_role(user, "editor")                       assign_role(user, "editor")
    remove_role(user, "editor")                    set_roles(user, ["editor", "viewer"])
    feature_enabled(user, "new-ui")                enabled_features(user)
    user.has_perm("app.codename", obj)             # object level, through the backend

DRF permission classes (``pleate_backend.rbac.permissions``), each call returns a
class that composes with ``|`` and ``&``::

    HasPerm("app.codename", ...)    every listed global permission
    HasRole("editor", ...)          any listed role (superusers pass)
    HasObjectPerm("app.codename")   object level, or the global permission
    HasFeature("new-ui")            the flag is on for the user
    ModelPerm("app.model")          view/add/change/delete from the HTTP method

A flag is on when ``enabled`` is set, the user is listed, one of the user's
roles is listed, or the user falls in ``rollout_percent``: the bucket is
``sha256("<key>:<user id>") % 100``, stable per user and independent per flag,
so raising the percentage only adds users.

Settings: none. Admin: Group (with its RoleInfo inline), RoleInfo,
ObjectPermission, Feature.
"""
