"""
The list of banned networks, cached so the middleware does not hit the
database on every request.

The list lives in the Django cache (shared by every worker when it is Redis)
for ``CACHE_SECONDS`` and is dropped whenever a ``Ban`` is saved or deleted.
Each process also keeps a parsed copy for ``LOCAL_SECONDS``.
"""

import functools
import ipaddress
import logging
import time

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Ban

logger = logging.getLogger("pleate.staff")

CACHE_KEY = "pl:staff:bans"
CACHE_SECONDS = 25
LOCAL_SECONDS = 5

_local: dict = {"at": 0.0, "value": None}


def _load() -> tuple:
    """((network, expires_timestamp or None), ...) of the active bans."""
    return tuple(
        (network, expires.timestamp() if expires else None)
        for network, expires in Ban.objects.active().values_list("network", "expires_at")
    )


@functools.lru_cache(maxsize=32)
def _parse(rows: tuple) -> tuple:
    parsed = []
    for network, expires in rows:
        try:
            parsed.append((ipaddress.ip_network(network, strict=False), expires))
        except ValueError:
            logger.warning("ignoring invalid ban network %r", network)
    return tuple(parsed)


def active_networks() -> tuple:
    now = time.monotonic()
    if _local["value"] is not None and now - _local["at"] < LOCAL_SECONDS:
        return _local["value"]
    try:
        rows = cache.get(CACHE_KEY)
        if rows is None:
            rows = _load()
            cache.set(CACHE_KEY, rows, CACHE_SECONDS)
    except Exception:  # noqa: BLE001
        logger.warning("ban list unavailable", exc_info=True)
        rows = ()
    value = _parse(rows)
    _local.update(at=now, value=value)
    return value


def is_banned(ip: str) -> bool:
    networks = active_networks()
    if not networks or not ip:
        return False
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    if getattr(addr, "ipv4_mapped", None):
        addr = addr.ipv4_mapped
    now = time.time()
    return any(
        addr.version == net.version and addr in net and (expires is None or expires > now)
        for net, expires in networks
    )


def invalidate() -> None:
    _local.update(at=0.0, value=None)
    try:
        cache.delete(CACHE_KEY)
    except Exception:  # noqa: BLE001
        logger.warning("could not invalidate the ban list", exc_info=True)


@receiver(post_save, sender=Ban, dispatch_uid="pleate_staff_ban_saved")
@receiver(post_delete, sender=Ban, dispatch_uid="pleate_staff_ban_deleted")
def _changed(**kwargs):
    invalidate()
