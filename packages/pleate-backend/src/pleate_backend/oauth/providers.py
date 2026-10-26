"""
OAuth 2 / OpenID Connect providers.

A provider is enabled when ``PLEATE["OAUTH"]["PROVIDERS"]`` has an entry for it. The
entry's ``type`` picks the class (defaults to the entry id), so a project can add a
provider with:

    from pleate_backend.oauth.providers import Provider, register_provider

    class GitLabProvider(Provider):
        name = "GitLab"
        authorize_url = "https://gitlab.com/oauth/authorize"
        token_url = "https://gitlab.com/oauth/token"
        scopes = ["read_user"]

        def get_identity(self, tokens, *, nonce, params):
            data = self.http_get("https://gitlab.com/api/v4/user", tokens["access_token"])
            return Identity(
                uid=str(data["id"]), email=data.get("email"), email_verified=False, name=data.get("name", "")
            )

    register_provider("gitlab", GitLabProvider)
"""

import json
import logging
import time
from dataclasses import dataclass, field
from urllib.parse import urlencode

import httpx
import jwt
from django.core.cache import cache
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError

from pleate_backend.core.conf import pleate_settings

logger = logging.getLogger("pleate.oauth")

TIMEOUT = 10


class OAuthError(Exception):
    """Anything wrong on the provider side. Never shown verbatim to the user."""


@dataclass
class Identity:
    uid: str
    email: str | None = None
    email_verified: bool = False
    name: str = ""
    extra: dict = field(default_factory=dict)


class _HttpxJWKClient(PyJWKClient):
    """PyJWKClient that downloads the key set with httpx (shared timeouts, mockable)."""

    def fetch_data(self):
        try:
            res = httpx.get(self.uri, headers=self.headers, timeout=self.timeout)
            res.raise_for_status()
            data = res.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise PyJWKClientConnectionError(f"Cannot fetch {self.uri}: {exc}") from exc
        if self.jwk_set_cache is not None:
            self.jwk_set_cache.put(data)
        self._last_successful_fetch = time.monotonic()
        return data


_jwk_clients: dict[str, PyJWKClient] = {}


def jwk_client(uri: str) -> PyJWKClient:
    if uri not in _jwk_clients:
        _jwk_clients[uri] = _HttpxJWKClient(uri, lifespan=3600, timeout=TIMEOUT)
    return _jwk_clients[uri]


def reset_caches():
    """Forget downloaded key sets. For tests."""
    _jwk_clients.clear()


def _truthy(value) -> bool:
    return value is True or (isinstance(value, str) and value.lower() == "true")


class Provider:
    """Authorization code flow with PKCE. Subclasses implement ``get_identity``."""

    id: str = ""
    name: str = ""
    authorize_url: str = ""
    token_url: str = ""
    scopes: list[str] = []
    pkce: bool = True
    # OpenID Connect providers send a nonce and check it in the id_token.
    uses_nonce: bool = False
    # Sent as ``response_mode`` when set (Apple needs ``form_post`` to share the email).
    response_mode: str | None = None
    extra_authorize_params: dict = {}

    def __init__(self, provider_id: str, config: dict):
        self.id = provider_id
        self.config = config
        if config.get("name"):
            self.name = config["name"]
        self.name = self.name or provider_id.title()
        if config.get("scopes"):
            self.scopes = list(config["scopes"])

    @property
    def client_id(self) -> str:
        return self.config["client_id"]

    def client_secret(self) -> str:
        return self.config.get("client_secret", "")

    def get_authorize_url(self) -> str:
        return self.authorize_url

    def get_token_url(self) -> str:
        return self.token_url

    def authorization_url(self, *, redirect_uri: str, state: str, nonce: str, code_challenge: str) -> str:
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            **self.extra_authorize_params,
        }
        if self.uses_nonce:
            params["nonce"] = nonce
        if self.pkce:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"
        if self.response_mode:
            params["response_mode"] = self.response_mode
        return f"{self.get_authorize_url()}?{urlencode(params)}"

    def exchange_code(self, *, code: str, redirect_uri: str, code_verifier: str) -> dict:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret(),
        }
        if self.pkce:
            data["code_verifier"] = code_verifier
        try:
            res = httpx.post(
                self.get_token_url(), data=data, headers={"Accept": "application/json"}, timeout=TIMEOUT
            )
            body = res.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise OAuthError(f"token request failed: {exc}") from exc
        if res.status_code >= 400 or "error" in body or "access_token" not in body:
            raise OAuthError(f"token request refused: {res.status_code} {body.get('error')}")
        return body

    def http_get(self, url: str, access_token: str):
        try:
            res = httpx.get(
                url,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                timeout=TIMEOUT,
            )
            res.raise_for_status()
            return res.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise OAuthError(f"GET {url} failed: {exc}") from exc

    def get_identity(self, tokens: dict, *, nonce: str, params: dict) -> Identity:
        raise NotImplementedError


class OIDCProvider(Provider):
    """
    OpenID Connect. The id_token is verified against the provider JWKS
    (signature, issuer, audience, expiry and nonce).

    Generic providers are configured with a ``discovery_url``:
    ``{"type": "oidc", "discovery_url": ".../.well-known/openid-configuration",
    "client_id": ..., "client_secret": ..., "name": "Okta", "scopes": [...]}``.
    """

    scopes = ["openid", "email", "profile"]
    uses_nonce = True
    issuer: str | list[str] = ""
    jwks_uri: str = ""
    userinfo_url: str = ""
    algorithms = ["RS256", "ES256", "PS256"]

    def discovery(self) -> dict:
        url = self.config.get("discovery_url")
        if not url:
            return {}
        key = f"pl:oauth:discovery:{url}"
        doc = cache.get(key)
        if doc is None:
            try:
                res = httpx.get(url, timeout=TIMEOUT)
                res.raise_for_status()
                doc = res.json()
            except (httpx.HTTPError, ValueError) as exc:
                raise OAuthError(f"discovery failed: {exc}") from exc
            cache.set(key, doc, 3600)
        return doc

    def _endpoint(self, attr: str, key: str) -> str:
        return getattr(self, attr) or self.discovery().get(key, "")

    def get_authorize_url(self):
        return self._endpoint("authorize_url", "authorization_endpoint")

    def get_token_url(self):
        return self._endpoint("token_url", "token_endpoint")

    def get_issuer(self):
        return self.issuer or self.discovery().get("issuer", "")

    def get_jwks_uri(self):
        return self._endpoint("jwks_uri", "jwks_uri")

    def get_userinfo_url(self):
        return self._endpoint("userinfo_url", "userinfo_endpoint")

    def verify_id_token(self, id_token: str, nonce: str) -> dict:
        try:
            key = jwk_client(self.get_jwks_uri()).get_signing_key_from_jwt(id_token)
            claims = jwt.decode(
                id_token,
                key.key,
                algorithms=self.algorithms,
                audience=self.client_id,
                issuer=self.get_issuer(),
                options={"require": ["iss", "aud", "exp", "sub"]},
                leeway=60,
            )
        except jwt.PyJWTError as exc:
            raise OAuthError(f"invalid id_token: {exc}") from exc
        if self.uses_nonce and claims.get("nonce") != nonce:
            raise OAuthError("id_token nonce mismatch")
        return claims

    def get_identity(self, tokens, *, nonce, params):
        if not tokens.get("id_token"):
            raise OAuthError("no id_token in the token response")
        claims = self.verify_id_token(tokens["id_token"], nonce)
        email, verified, name = claims.get("email"), claims.get("email_verified"), claims.get("name", "")
        userinfo_url = self.get_userinfo_url()
        if (not email or not name) and userinfo_url and tokens.get("access_token"):
            info = self.http_get(userinfo_url, tokens["access_token"])
            if info.get("sub") == claims["sub"]:
                if not email:
                    email, verified = info.get("email"), info.get("email_verified")
                name = name or info.get("name", "")
        return Identity(
            uid=str(claims["sub"]),
            email=(email or "").strip().lower() or None,
            email_verified=_truthy(verified),
            name=name or "",
            extra={k: claims[k] for k in ("picture", "locale", "given_name", "family_name") if k in claims},
        )


class GoogleProvider(OIDCProvider):
    name = "Google"
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    jwks_uri = "https://www.googleapis.com/oauth2/v3/certs"
    userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"
    issuer = ["https://accounts.google.com", "accounts.google.com"]
    extra_authorize_params = {"prompt": "select_account"}


class AppleProvider(OIDCProvider):
    """
    Sign in with Apple. Config: ``client_id`` (the Services ID), ``team_id``, ``key_id``
    and ``private_key`` (the .p8 content). The client secret is an ES256 JWT.
    Apple posts the callback (``form_post``) and sends the name only the first time.
    """

    name = "Apple"
    authorize_url = "https://appleid.apple.com/auth/authorize"
    token_url = "https://appleid.apple.com/auth/token"
    jwks_uri = "https://appleid.apple.com/auth/keys"
    issuer = "https://appleid.apple.com"
    scopes = ["name", "email"]
    response_mode = "form_post"
    # Apple does not document PKCE: state and nonce protect the flow.
    pkce = False

    def client_secret(self) -> str:
        now = int(time.time())
        payload = {
            "iss": self.config["team_id"],
            "iat": now,
            "exp": now + 300,
            "aud": "https://appleid.apple.com",
            "sub": self.client_id,
        }
        return jwt.encode(
            payload, self.config["private_key"], algorithm="ES256", headers={"kid": self.config["key_id"]}
        )

    def get_identity(self, tokens, *, nonce, params):
        claims = self.verify_id_token(tokens.get("id_token") or "", nonce)
        name = ""
        raw_user = params.get("user")
        if raw_user:
            try:
                parts = json.loads(raw_user).get("name") or {}
                name = " ".join(p for p in (parts.get("firstName"), parts.get("lastName")) if p)
            except (ValueError, AttributeError):
                name = ""
        extra = {}
        if _truthy(claims.get("is_private_email")):
            extra["is_private_email"] = True
        return Identity(
            uid=str(claims["sub"]),
            email=(claims.get("email") or "").lower() or None,
            email_verified=_truthy(claims.get("email_verified")),
            name=name,
            extra=extra,
        )


class GitHubProvider(Provider):
    name = "GitHub"
    authorize_url = "https://github.com/login/oauth/authorize"
    token_url = "https://github.com/login/oauth/access_token"
    api_url = "https://api.github.com"
    scopes = ["read:user", "user:email"]

    def get_identity(self, tokens, *, nonce, params):
        token = tokens["access_token"]
        profile = self.http_get(f"{self.api_url}/user", token)
        emails = self.http_get(f"{self.api_url}/user/emails", token)
        primary = next(
            (e for e in emails if isinstance(e, dict) and e.get("primary")),
            None,
        )
        return Identity(
            uid=str(profile["id"]),
            email=(primary["email"].lower() if primary else None),
            email_verified=bool(primary and primary.get("verified")),
            name=profile.get("name") or profile.get("login") or "",
            extra={k: profile[k] for k in ("login", "avatar_url", "html_url") if profile.get(k)},
        )


_registry: dict[str, type[Provider]] = {
    "google": GoogleProvider,
    "github": GitHubProvider,
    "apple": AppleProvider,
    "oidc": OIDCProvider,
}


def register_provider(type_name: str, cls: type[Provider]):
    _registry[type_name] = cls


def _configs() -> dict:
    return (pleate_settings.OAUTH or {}).get("PROVIDERS") or {}


def get_provider(provider_id: str) -> Provider | None:
    config = _configs().get(provider_id)
    if not config:
        return None
    cls = _registry.get(config.get("type") or provider_id)
    if cls is None:
        logger.warning("unknown oauth provider type for %s", provider_id)
        return None
    return cls(provider_id, config)


def enabled_providers() -> list[Provider]:
    return [p for p in (get_provider(pid) for pid in _configs()) if p is not None]
