"""
Usage: the signed in user's plan and how much of each limit they use, for the
pleate ``UsageMeter``. Mounted at ``/api/usage``.

Endpoints:

    GET  /usage    signed in (session or API key)
        {plan, items: [{id, label, used, limit, unit}]}
        ``plan`` is the billing plan id (the active subscription, else the free
        plan) or null. ``limit`` is null when there is no limit. Items, each
        present only when its app is installed:

            storage     files.services.usage       FILES["USER_QUOTA"]       bytes
            ai_tokens   tokens used today          AI["DAILY_TOKEN_LIMIT"]   tokens
            api_keys    active API keys            25                        keys
            webhooks    webhook endpoints          20                        endpoints

The numbers are cached per user for ``CACHE_SECONDS`` (30), so a meter can
lag a fresh upload by that much.
"""
