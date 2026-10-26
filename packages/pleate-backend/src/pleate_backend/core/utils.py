import hashlib
import ipaddress
import secrets

from .conf import pleate_settings


def _networks():
    return [ipaddress.ip_network(cidr, strict=False) for cidr in pleate_settings.TRUSTED_PROXIES]


def client_ip(request) -> str:
    """
    The client address. X-Forwarded-For is only read when the direct peer is a
    trusted proxy, and then the right-most untrusted hop wins.
    """
    remote = request.META.get("REMOTE_ADDR", "") or ""
    try:
        peer = ipaddress.ip_address(remote)
    except ValueError:
        return remote
    nets = _networks()
    if not any(peer in net for net in nets):
        return remote
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    hops = [h.strip() for h in forwarded.split(",") if h.strip()]
    for hop in reversed(hops):
        try:
            addr = ipaddress.ip_address(hop)
        except ValueError:
            continue
        if not any(addr in net for net in nets):
            return hop
    return hops[0] if hops else remote


def user_agent(request) -> str:
    return (request.META.get("HTTP_USER_AGENT") or "")[:400]


def random_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()
