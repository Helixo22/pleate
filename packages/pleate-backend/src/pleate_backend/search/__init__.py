"""
Search: one query over the signed in user's own data, for a command palette.
Mounted at ``/api/search``.

Endpoints:

    GET  /search?q=&types=&limit=    signed in (session or API key)
        -> [{type, id, title, subtitle, url}]
        ``q`` 2 to 100 characters, matched case insensitively anywhere in the
        title (taken literally, not as a pattern). ``types`` is a comma
        separated subset of ``files,conversations,notifications`` (default:
        every installed one). ``limit`` 1 to 10 per type (default 5).
        Results are grouped by type, newest first within a type.

        files           name, subtitle content type, url FRONTEND_PATHS["FILE"]
        conversations   title, url FRONTEND_PATHS["CONVERSATION"]
        notifications   title, subtitle body, url the notification link when it
                        is a path or http(s), else FRONTEND_PATHS["NOTIFICATIONS"]

Every query filters on the owner first. Rate limited by the default user throttle.
"""
