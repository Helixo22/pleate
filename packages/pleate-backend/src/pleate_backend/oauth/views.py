import base64
import hashlib
import logging
import secrets
import time
from urllib.parse import urlencode

from django.contrib.auth import get_user, get_user_model
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.accounts import signals as account_signals
from pleate_backend.accounts.services import complete_login, login_challenges
from pleate_backend.accounts.views import send_security_notice
from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.core.csrf import CsrfProtectedMixin
from pleate_backend.core.exceptions import ApiError

from . import serializers as s
from . import signals
from .models import SocialAccount
from .providers import OAuthError, get_provider

User = get_user_model()
logger = logging.getLogger("pleate.oauth")

SESSION_KEY = "pl_oauth"
STATE_MAX_AGE = 10 * 60
MAX_PENDING_FLOWS = 5


def _conf() -> dict:
    return pleate_settings.OAUTH or {}


def safe_next(value: str | None) -> str:
    """Only paths on the frontend: "/x" but not "//host", "/\\host" or "http://"."""
    if not value or not value.startswith("/") or value.startswith("//"):
        return "/"
    if "\\" in value or any(ord(c) < 32 for c in value):
        return "/"
    return value[:1000]


def done(status: str, next_path: str = "/", code: str | None = None) -> HttpResponseRedirect:
    params = {"status": status}
    if code:
        params["code"] = code
    params["next"] = next_path
    return HttpResponseRedirect(f"{frontend_url('OAUTH_DONE')}?{urlencode(params)}")


def callback_url(request, provider_id: str) -> str:
    path = reverse("oauth:callback", kwargs={"provider": provider_id})
    base = _conf().get("CALLBACK_BASE_URL")
    return base.rstrip("/") + path if base else request.build_absolute_uri(path)


def _pkce_challenge(verifier: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()


def _provider_or_404(provider_id):
    provider = get_provider(provider_id)
    if provider is None:
        raise ApiError("oauth_unknown_provider", _("This sign in method is not available."), 404)
    return provider


class ProvidersView(APIView):
    permission_classes = [AllowAny]
    pagination_class = None

    @extend_schema(responses=s.OAuthProviderSerializer(many=True), tags=["oauth"])
    def get(self, request):
        from .providers import enabled_providers

        return Response([{"id": p.id, "name": p.name} for p in enabled_providers()])


class StartView(APIView):
    """Browser navigation: redirects to the provider."""

    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("next", str, description="Frontend path to go back to, must start with /."),
            OpenApiParameter(
                "mode", str, enum=["login", "link"], description="link attaches to the signed in user."
            ),
            OpenApiParameter("remember", bool, description="Long lived session after login."),
        ],
        responses={302: OpenApiResponse(description="Redirect to the provider")},
        tags=["oauth"],
    )
    def get(self, request, provider):
        provider_obj = _provider_or_404(provider)
        mode = request.query_params.get("mode") or "login"
        if mode not in ("login", "link"):
            raise ApiError("invalid_mode", _("Unknown mode."), 400)
        if mode == "link" and not request.user.is_authenticated:
            raise ApiError("not_authenticated", _("Sign in first."), 401)

        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(64)
        flows = {
            k: v
            for k, v in (request.session.get(SESSION_KEY) or {}).items()
            if time.time() - v.get("at", 0) < STATE_MAX_AGE
        }
        # Keep the newest few: several tabs may start a flow at once.
        flows = dict(sorted(flows.items(), key=lambda kv: kv[1]["at"])[-(MAX_PENDING_FLOWS - 1) :])
        flows[state] = {
            "provider": provider_obj.id,
            "nonce": nonce,
            "verifier": verifier,
            "next": safe_next(request.query_params.get("next")),
            "mode": mode,
            "remember": request.query_params.get("remember") in ("1", "true", "True"),
            "uid": str(request.user.pk) if mode == "link" else None,
            "at": time.time(),
        }
        request.session[SESSION_KEY] = flows
        try:
            url = provider_obj.authorization_url(
                redirect_uri=callback_url(request, provider_obj.id),
                state=state,
                nonce=nonce,
                code_challenge=_pkce_challenge(verifier),
            )
        except OAuthError:
            logger.warning("oauth start failed for %s", provider_obj.id, exc_info=True)
            return done("error", flows[state]["next"], "oauth_provider_error")
        return HttpResponseRedirect(url)


class CallbackView(APIView):
    """
    Where the provider sends the browser back. GET for most providers, POST for
    Apple (``form_post``). The POST is turned into a GET with a 303 redirect: the
    session cookie is SameSite=Lax, so a cross site POST does not carry it, while
    the top level GET that follows does. CSRF does not apply, the state does.
    """

    permission_classes = [AllowAny]
    # The session is read directly: no DRF authentication, so no CSRF check on POST.
    authentication_classes = []
    parser_classes = [FormParser, MultiPartParser]

    @extend_schema(
        parameters=[
            OpenApiParameter("code", str),
            OpenApiParameter("state", str),
            OpenApiParameter("error", str),
        ],
        responses={302: OpenApiResponse(description="Redirect to the frontend OAUTH_DONE page")},
        tags=["oauth"],
    )
    def get(self, request, provider):
        return self.handle(request, provider, request.query_params)

    @extend_schema(
        request={"application/x-www-form-urlencoded": OpenApiTypes.OBJECT},
        responses={303: OpenApiResponse(description="Redirect to the same callback with GET")},
        tags=["oauth"],
    )
    def post(self, request, provider):
        keys = ("code", "state", "error", "user")
        params = {k: request.data[k] for k in keys if request.data.get(k)}
        url = reverse("oauth:callback", kwargs={"provider": provider})
        response = HttpResponseRedirect(f"{url}?{urlencode(params)}")
        response.status_code = 303
        return response

    def handle(self, request, provider_id, params):
        flows = request.session.get(SESSION_KEY) or {}
        state = params.get("state") or ""
        flow = flows.pop(state, None) if state else None
        if flow is not None:
            request.session[SESSION_KEY] = flows
        if (
            flow is None
            or flow.get("provider") != provider_id
            or time.time() - flow.get("at", 0) > STATE_MAX_AGE
        ):
            return done("error", "/", "oauth_state_mismatch")
        next_path = flow["next"]

        provider = get_provider(provider_id)
        if provider is None or params.get("error") or not params.get("code"):
            return done("error", next_path, "oauth_provider_error")
        try:
            redirect_uri = callback_url(request, provider_id)
            tokens = provider.exchange_code(
                code=params["code"], redirect_uri=redirect_uri, code_verifier=flow["verifier"]
            )
            identity = provider.get_identity(tokens, nonce=flow["nonce"], params=params)
        except (OAuthError, KeyError) as exc:
            logger.warning("oauth callback failed for %s: %s", provider_id, exc)
            return done("error", next_path, "oauth_provider_error")

        if flow["mode"] == "link":
            return self.link(request, provider, identity, flow)
        return self.login(request, provider, identity, flow)

    def link(self, request, provider, identity, flow):
        next_path = flow["next"]
        # Read from the session: this view skips DRF authentication.
        user = get_user(request._request)
        if not user.is_authenticated or str(user.pk) != flow.get("uid"):
            return done("error", next_path, "oauth_state_mismatch")
        account = SocialAccount.objects.filter(provider=provider.id, uid=identity.uid).first()
        if account is not None:
            if account.user_id != user.pk:
                return done("error", next_path, "oauth_already_linked")
            _refresh(account, identity, login=False)
            return done("ok", next_path)
        try:
            account = SocialAccount.objects.create(
                user=user,
                provider=provider.id,
                uid=identity.uid,
                email=identity.email or "",
                extra=identity.extra,
            )
        except IntegrityError:
            return done("error", next_path, "oauth_already_linked")
        signals.social_account_linked.send(
            sender=SocialAccount, user=user, request=request, social_account=account
        )
        send_security_notice(
            user, _("A %(provider)s account was linked to your account.") % {"provider": provider.name}
        )
        return done("ok", next_path)

    def login(self, request, provider, identity, flow):
        next_path = flow["next"]
        account = (
            SocialAccount.objects.select_related("user")
            .filter(provider=provider.id, uid=identity.uid)
            .first()
        )
        if account is not None:
            user = account.user
            if not user.is_active:
                return done("error", next_path, "account_inactive")
            _refresh(account, identity, login=True)
        else:
            if not identity.email or not identity.email_verified:
                return done("error", next_path, "oauth_email_unverified")
            if User.objects.filter(email__iexact=identity.email).exists():
                # Never link automatically: the user signs in and links from the settings.
                return done("error", next_path, "oauth_email_exists")
            if not _conf().get("ALLOW_SIGNUP", True):
                return done("error", next_path, "oauth_signup_disabled")
            user = User.objects.create_user(
                email=identity.email,
                password=None,
                name=(identity.name or "")[:150],
                email_verified=True,
                has_password=False,
                locale=get_language() or "",
            )
            try:
                account = SocialAccount.objects.create(
                    user=user,
                    provider=provider.id,
                    uid=identity.uid,
                    email=identity.email,
                    extra=identity.extra,
                    last_login_at=timezone.now(),
                )
            except IntegrityError:
                user.delete()
                return done("error", next_path, "oauth_already_linked")
            account_signals.user_signed_up.send(sender=User, user=user, request=request)
            signals.social_account_linked.send(
                sender=SocialAccount, user=user, request=request, social_account=account
            )

        remember = bool(flow.get("remember"))
        for challenge in login_challenges:
            if challenge(request, user, remember):
                return done("mfa_required", next_path)
        complete_login(request, user, remember)
        return done("ok", next_path)


def _refresh(account, identity, login: bool):
    account.email = identity.email or account.email
    account.extra = {**(account.extra or {}), **identity.extra}
    fields = ["email", "extra"]
    if login:
        account.last_login_at = timezone.now()
        fields.append("last_login_at")
    account.save(update_fields=fields)


class AccountListView(APIView):
    pagination_class = None

    @extend_schema(responses=s.SocialAccountSerializer(many=True), tags=["oauth"])
    def get(self, request):
        rows = SocialAccount.objects.filter(user=request.user).order_by("created_at")
        return Response(s.SocialAccountSerializer(rows, many=True).data)


class AccountDetailView(CsrfProtectedMixin, APIView):
    @extend_schema(responses={204: None}, tags=["oauth"])
    def delete(self, request, pk):
        user = request.user
        account = get_object_or_404(SocialAccount, pk=pk, user=user)
        others = SocialAccount.objects.filter(user=user).exclude(pk=account.pk).exists()
        if not user.has_password and not others:
            raise ApiError(
                "last_login_method",
                _("Set a password or link another account before removing this one."),
                400,
            )
        provider = get_provider(account.provider)
        account.delete()
        signals.social_account_unlinked.send(
            sender=SocialAccount, user=user, request=request, social_account=account
        )
        send_security_notice(
            user,
            _("A %(provider)s account was unlinked from your account.")
            % {"provider": provider.name if provider else account.provider},
        )
        return Response(status=204)
