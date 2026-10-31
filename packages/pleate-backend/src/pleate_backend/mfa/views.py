import pyotp
import segno
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.accounts.services import complete_login
from pleate_backend.accounts.views import me_payload, send_security_notice
from pleate_backend.apikeys.permissions import DenyAPIKey
from pleate_backend.core.csrf import CsrfProtectedMixin
from pleate_backend.core.exceptions import ApiError
from pleate_backend.ratelimit import limits
from pleate_backend.ratelimit.throttles import StrictScopedRateThrottle

from . import serializers as s
from . import services, signals
from .models import BackupCode, TOTPDevice

User = get_user_model()

# Code attempts per user across pending logins, on top of the per login limit.
USER_FAILURE_LIMIT = 20
USER_FAILURE_WINDOW = 15 * 60


def _invalid_code(extra=None):
    return ApiError("invalid_code", _("The code is not valid."), 400, extra)


def _already_enabled():
    return ApiError("mfa_already_enabled", _("Two factor authentication is already enabled."), 409)


def _require_device(user) -> TOTPDevice:
    device = services.confirmed_device(user)
    if device is None:
        raise ApiError("mfa_not_enabled", _("Two factor authentication is not enabled."), 400)
    return device


class MfaView(CsrfProtectedMixin, APIView):
    permission_classes = [IsAuthenticated, DenyAPIKey]
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"


class StatusView(APIView):
    @extend_schema(responses=s.MfaStatusSerializer, tags=["mfa"])
    def get(self, request):
        device = services.confirmed_device(request.user)
        return Response(
            {
                "enabled": device is not None,
                "confirmed_at": device.confirmed_at if device else None,
                "backup_codes_remaining": services.backup_codes_remaining(request.user) if device else 0,
            }
        )


class SetupView(MfaView):
    @extend_schema(request=None, responses=s.MfaSetupResponseSerializer, tags=["mfa"])
    def post(self, request):
        user = request.user
        if services.is_enabled(user):
            raise _already_enabled()
        TOTPDevice.objects.filter(user=user).delete()
        secret = pyotp.random_base32()
        device = TOTPDevice(user=user)
        device.secret = secret
        try:
            device.save()
        except IntegrityError as exc:  # a parallel setup created the device first
            raise _already_enabled() from exc
        url = pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=services.issuer())
        svg = segno.make(url, error="m").svg_inline(scale=4, border=2, omitsize=True)
        return Response({"secret": secret, "otpauth_url": url, "qr_svg": svg})


class ConfirmView(MfaView):
    @extend_schema(request=s.MfaCodeSerializer, responses=s.MfaBackupCodesSerializer, tags=["mfa"])
    def post(self, request):
        ser = s.MfaCodeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        device = TOTPDevice.objects.filter(user=user).first()
        if device is None:
            raise ApiError("mfa_setup_required", _("Start the setup first."), 400)
        if device.confirmed:
            raise _already_enabled()
        if not services.verify_totp(device, ser.validated_data["code"]):
            raise _invalid_code()
        device.confirmed_at = timezone.now()
        device.save(update_fields=["confirmed_at"])
        codes = services.generate_backup_codes(user)
        signals.mfa_enabled.send(sender=TOTPDevice, user=user, request=request)
        send_security_notice(user, _("Two factor authentication was turned on for your account."))
        return Response({"backup_codes": codes})


class DisableView(MfaView):
    @extend_schema(request=s.MfaDisableSerializer, responses={204: None}, tags=["mfa"])
    def post(self, request):
        ser = s.MfaDisableSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        device = _require_device(user)
        if user.has_password and not user.check_password(ser.validated_data.get("password") or ""):
            raise ApiError("wrong_password", _("The password is wrong."), 400)
        if not services.verify_any(user, device, ser.validated_data["code"], request):
            raise _invalid_code()
        TOTPDevice.objects.filter(user=user).delete()
        BackupCode.objects.filter(user=user).delete()
        signals.mfa_disabled.send(sender=TOTPDevice, user=user, request=request)
        send_security_notice(user, _("Two factor authentication was turned off for your account."))
        return Response(status=204)


class BackupCodesView(MfaView):
    @extend_schema(request=s.MfaCodeSerializer, responses=s.MfaBackupCodesSerializer, tags=["mfa"])
    def post(self, request):
        ser = s.MfaCodeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        device = _require_device(user)
        if not services.verify_any(user, device, ser.validated_data["code"], request):
            raise _invalid_code()
        return Response({"backup_codes": services.generate_backup_codes(user)})


class VerifyView(MfaView):
    permission_classes = [AllowAny]

    @extend_schema(request=s.MfaVerifySerializer, responses=s.MfaVerifyResponseSerializer, tags=["mfa"])
    def post(self, request):
        ser = s.MfaVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        code = ser.validated_data.get("code") or ""
        backup = ser.validated_data.get("backup_code") or ""
        if not code and not backup:
            raise ApiError("code_required", _("Type the code from your app or a backup code."), 400)

        expired = ApiError("mfa_pending_expired", _("The sign in expired. Sign in again."), 400)
        pending = services.read_pending(request)
        if pending is None:
            raise expired
        user = User.objects.filter(pk=pending["uid"], is_active=True).first()
        device = user and services.confirmed_device(user)
        if device is None:
            services.clear_pending(request)
            raise expired

        # Count first, verify after: a check then a count would let parallel guesses all pass.
        user_key = f"mfa:user:{user.pk}"
        allowed, retry = limits.hit(user_key, USER_FAILURE_LIMIT, USER_FAILURE_WINDOW, fail_closed=True)
        if not allowed:
            services.clear_pending(request)
            raise ApiError(
                "too_many_attempts", _("Too many attempts. Try again later."), 429, {"retry_after": retry}
            )
        attempts = services.count_pending_attempt(pending)
        if attempts > services.MAX_PENDING_ATTEMPTS:
            services.clear_pending(request)
            raise expired

        ok = services.verify_totp(device, code) if code else services.use_backup_code(user, backup, request)
        if not ok:
            left = services.MAX_PENDING_ATTEMPTS - attempts
            if not left:
                services.clear_pending(request)
            raise _invalid_code({"attempts_left": left})

        limits.reset(user_key, USER_FAILURE_WINDOW)
        services.clear_pending(request)
        complete_login(request, user, bool(pending.get("remember")))
        return Response({"user": me_payload(user), "mfa_required": False})
