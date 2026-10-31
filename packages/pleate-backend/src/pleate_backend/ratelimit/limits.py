"""
Sliding window counters on the Django cache (use Redis in production so the
counters are shared by every worker).

    allowed, retry_after = hit("login:ip:1.2.3.4", limit=30, window=900)

Count first, then do the slow check: ``hit`` is atomic, ``peek`` then ``hit``
is not (parallel requests all pass the peek).

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


def consume(key: str, limit: int, window: int, *, fail_closed: bool = False) -> tuple[bool, int, int, int]:
    """
    Count one event, atomically: the bucket is incremented first and the
    returned value compared, so parallel requests cannot all pass a check.
    A refused event is not counted. Returns ``(allowed, retry_after,
    remaining, reset)``, ``reset`` being the seconds left in the current window.
    """
    now = time.time()
    cur_key, prev_key, current = _buckets(key, window, now)
    reset_in = max(1, math.ceil((current + 1) * window - now))
    try:
        prev = cache.get_many([prev_key]).get(prev_key, 0)
        count = 1 if cache.add(cur_key, 1, timeout=window * 2) else cache.incr(cur_key)
        estimate = count + prev * (window - (now - current * window)) / window
        if estimate > limit:
            cache.decr(cur_key)
            return False, reset_in, 0, reset_in
        return True, 0, max(0, limit - math.ceil(estimate)), reset_in
    except Exception:  # noqa: BLE001
        logger.warning("rate limit cache unavailable", exc_info=True)
        return (not fail_closed), (window if fail_closed else 0), (0 if fail_closed else limit), window


def hit(key: str, limit: int, window: int, *, fail_closed: bool = False) -> tuple[bool, int]:
    """Count one event. Returns ``(allowed, retry_after_seconds)``."""
    return consume(key, limit, window, fail_closed=fail_closed)[:2]


def remaining(key: str, limit: int, window: int) -> int:
    try:
        count, _ = _estimate(key, window, time.time())
    except Exception:  # noqa: BLE001
        return limit
    return max(0, limit - math.ceil(count))


def refund(key: str, window: int) -> None:
    """Give back one event counted by ``consume`` in the current window."""
    cur_key, _, _ = _buckets(key, window, time.time())
    try:
        cache.decr(cur_key)
    except Exception:  # noqa: BLE001
        pass  # the window rolled over or the cache is down: nothing to give back


def reset(key: str, window: int) -> None:
    cur_key, prev_key, _ = _buckets(key, window, time.time())
    try:
        cache.delete_many([cur_key, prev_key])
    except Exception:  # noqa: BLE001
        logger.warning("rate limit cache unavailable", exc_info=True)
