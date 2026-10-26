"""
Sliding window counters on the Django cache (use Redis in production so the
counters are shared by every worker).

    allowed, retry_after = hit("login:ip:1.2.3.4", limit=30, window=900)

The window is approximated with two fixed buckets weighted by overlap, which
is accurate enough for abuse protection and needs only two cache keys.

``fail_closed=True`` denies the request when the cache is unreachable. Use it
on authentication paths; everything else fails open.
"""

import logging
import math
import time

from django.core.cache import cache

logger = logging.getLogger("pleate.ratelimit")


def _buckets(key: str, window: int, now: float):
    current = int(now // window)
    return f"pl:rl:{key}:{current}", f"pl:rl:{key}:{current - 1}", current


def _estimate(key: str, window: int, now: float) -> tuple[float, int]:
    cur_key, prev_key, current = _buckets(key, window, now)
    values = cache.get_many([cur_key, prev_key])
    elapsed = now - current * window
    weight = (window - elapsed) / window
    return values.get(cur_key, 0) + values.get(prev_key, 0) * weight, current


def peek(key: str, limit: int, window: int, *, fail_closed: bool = False) -> tuple[bool, int]:
    """Check without counting."""
    now = time.time()
    try:
        count, current = _estimate(key, window, now)
    except Exception:  # noqa: BLE001
        logger.warning("rate limit cache unavailable", exc_info=True)
        return (not fail_closed), (window if fail_closed else 0)
    if count >= limit:
        return False, max(1, math.ceil((current + 1) * window - now))
    return True, 0


def hit(key: str, limit: int, window: int, *, fail_closed: bool = False) -> tuple[bool, int]:
    """Count one event. Returns ``(allowed, retry_after_seconds)``."""
    now = time.time()
    try:
        count, current = _estimate(key, window, now)
        if count >= limit:
            return False, max(1, math.ceil((current + 1) * window - now))
        cur_key = f"pl:rl:{key}:{current}"
        if cache.add(cur_key, 1, timeout=window * 2):
            return True, 0
        cache.incr(cur_key)
        return True, 0
    except Exception:  # noqa: BLE001
        logger.warning("rate limit cache unavailable", exc_info=True)
        return (not fail_closed), (window if fail_closed else 0)


def remaining(key: str, limit: int, window: int) -> int:
    try:
        count, _ = _estimate(key, window, time.time())
    except Exception:  # noqa: BLE001
        return limit
    return max(0, limit - math.ceil(count))


def reset(key: str, window: int) -> None:
    cur_key, prev_key, _ = _buckets(key, window, time.time())
    try:
        cache.delete_many([cur_key, prev_key])
    except Exception:  # noqa: BLE001
        logger.warning("rate limit cache unavailable", exc_info=True)
