"""
Back office API: users, IP bans and numbers for a dashboard.

Every endpoint needs ``is_staff`` or the matching model permission (granted
through a role, see ``rbac``): ``pleate_accounts.view_user`` /
``change_user`` / ``delete_user`` for users, ``pleate_staff.*_ban`` for bans,
``pleate_accounts.view_user`` for stats.

Endpoints (mounted at ``/api/staff/``):

    GET    users                          page list, ?search= (email, name),
                                          ?is_active= ?is_staff= ?email_verified= ?role=<name>,
                                          ?ordering=date_joined,email,last_login,name
                                          items {id, email, name, display_name, avatar_url,
                                                 email_verified, is_active, is_staff, is_superuser,
                                                 date_joined, last_login, roles}
    GET    users/<id>                     the same plus has_password, locale, timezone, sessions_count,
                                          mfa_enabled (null when the mfa app is not installed)
    PATCH  users/<id>                     {name?, is_active?, is_staff?, email_verified?, roles?: [names]}
                                          deactivating signs the user out everywhere
    DELETE users/<id>                     204
    POST   users/<id>/revoke-sessions     {count}
    POST   users/<id>/password-reset      202, emails a reset link (same email as /auth/password/reset)
    GET    bans                           page list, ?search= (network, reason),
                                          ?ordering=created_at,expires_at,network
    POST   bans                           {network: "1.2.3.4" | "10.0.0.0/8" | "2001:db8::/32",
                                           reason?, expires_at?}
    GET    bans/<id>                      {id, network, reason, expires_at, is_active, created_by, created_at}
    PATCH  bans/<id>
    DELETE bans/<id>                      204, lifts the ban
    GET    stats                          {users_total, users_active, users_new_7d, users_new_30d,
                                           sessions_active, signups_by_day: [{date, count}]}
                                          (30 days, oldest first, users_active = not deactivated)

Error codes: ``cannot_modify_self`` (deactivate, demote or delete yourself),
``cannot_modify_superuser`` (only superusers change superusers),
``permission_denied`` (changing staff access needs ``is_staff``, changing roles
needs ``is_staff`` or ``auth.change_group``), ``unknown_role``, ``user_inactive``,
``invalid_network``, ``cannot_ban_self``, and ``banned`` from the middleware.

``BanMiddleware`` answers 403 ``{"error": {"status": 403, "code": "banned", ...}}``
to clients whose address (``core.utils.client_ip``, so X-Forwarded-For from
trusted proxies) is in an active ban. ``/api/health`` is never blocked. The
active networks live in the Django cache for 25 seconds and in each process for
5 seconds; saving or deleting a ``Ban`` drops both, so a warm request makes no
database query. Use Redis as the cache so every worker sees changes at once.
If the cache is down the middleware lets requests through.

Helpers: ``staff.bans.is_banned(ip)``, ``staff.bans.invalidate()``,
``Ban.objects.active()``.

Settings: none. Admin: Ban.
"""
