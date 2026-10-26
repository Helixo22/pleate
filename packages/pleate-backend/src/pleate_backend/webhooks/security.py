"""Signing and the SSRF guard for outgoing webhooks."""

import hashlib
import hmac
import ipaddress
import secrets
import socket
import time
from urllib.parse import urlsplit

from django.utils.translation import gettext_lazy as _

from pleate_backend.core.conf import pleate_settings

SECRET_PREFIX = "whsec_"


def new_secret() -> str:
    return SECRET_PREFIX + secrets.token_urlsafe(32)


def sign(secret: str, timestamp: int, body: bytes | str) -> str:
    """Hex HMAC SHA256 of ``f"{timestamp}.{body}"`` keyed with the whole secret."""
    if isinstance(body, str):
        body = body.encode()
    message = str(timestamp).encode() + b"." + body
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def signature_header(secret: str, body: bytes | str, timestamp: int | None = None) -> str:
    ts = int(time.time()) if timestamp is None else int(timestamp)
    return f"t={ts},v1={sign(secret, ts, body)}"


class UrlNotAllowed(Exception):
    def __init__(self, message):
        super().__init__(str(message))
        self.message = message


def _blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    mapped = getattr(ip, "ipv4_mapped", None)
    if mapped is not None:
        ip = mapped
    return (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
        or not ip.is_global
    )


def check_url(url: str) -> None:
    """
    Raises ``UrlNotAllowed`` unless ``url`` is https and every address its host
    resolves to is public. ``WEBHOOKS["ALLOW_PRIVATE_URLS"]`` lifts both rules
    (local development).
    """
    allow_private = bool(pleate_settings.WEBHOOKS.get("ALLOW_PRIVATE_URLS"))
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError as exc:
        raise UrlNotAllowed(_("This URL is not valid.")) from exc
    scheme = parts.scheme.lower()
    if scheme not in ("https", "http") or (scheme == "http" and not allow_private):
        raise UrlNotAllowed(_("Use an https URL."))
    host = parts.hostname
    if not host:
        raise UrlNotAllowed(_("This URL is not valid."))
    if parts.username or parts.password:
        raise UrlNotAllowed(_("Credentials in the URL are not allowed."))
    if allow_private:
        return
    try:
        infos = socket.getaddrinfo(host, port or 443, proto=socket.IPPROTO_TCP)
    except (socket.gaierror, UnicodeError, OSError) as exc:
        raise UrlNotAllowed(_("The host of this URL could not be resolved.")) from exc
    if not infos:
        raise UrlNotAllowed(_("The host of this URL could not be resolved."))
    for info in infos:
        address = info[4][0].split("%", 1)[0]
        try:
            ip = ipaddress.ip_address(address)
        except ValueError as exc:
            raise UrlNotAllowed(_("The host of this URL could not be resolved.")) from exc
        if _blocked(ip):
            raise UrlNotAllowed(_("This URL points to a private or reserved address."))
