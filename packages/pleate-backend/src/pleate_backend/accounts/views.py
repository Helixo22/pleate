import io

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, logout, update_session_auth_hash
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.core.csrf import CsrfProtectedMixin
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.utils import client_ip
from pleate_backend.emails import send_email
from pleate_backend.ratelimit import limits
from pleate_backend.ratelimit.throttles import StrictScopedRateThrottle

from . import serializers as s
from . import signals
from .models import UserSession
from .services import (
    complete_login,
    describe_user_agent,
    login_challenges,
    public_session_id,
    revoke_sessions,
)
from .tokens import make_reset_token, make_signed, read_reset_token, read_signed

User = get_user_model()


def _language(user=None):
    return (user and user.locale) or get_language()


def send_verification(user):
    token = make_signed("verify", {"uid": str(user.pk), "email": user.email})
    send_email(
        "verify_email",
        user.email,
        {
            "name": user.display_name,
            "action_url": frontend_url("VERIFY_EMAIL", token=token),
            "action_label": _("Confirm email"),
        },
        _language(user),
    )


def send_security_notice(user, message: str, to: str | None = None):
    send_email(
        "security_notice", to or user.email, {"name": user.display_name, "message": message}, _language(user)
    )


def me_payload(user):
    return s.MeSerializer(user).data


class AuthView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"


class SignupView(AuthView):
    throttle_scope = "signup"

    @extend_schema(request=s.SignupSerializer, responses={201: s.SignupResponseSerializer}, tags=["auth"])
    def post(self, request):
        if not pleate_settings.AUTH["SIGNUP_ENABLED"]:
            raise ApiError("signup_disabled", _("Sign up is closed."), 403)
        ser = s.SignupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            name=data.get("name", ""),
            locale=data.get("locale") or get_language() or "",
        )
        signals.user_signed_up.send(sender=User, user=user, request=request)
        send_verification(user)
        required = pleate_settings.AUTH["REQUIRE_EMAIL_VERIFICATION"]
        if not required:
            complete_login(request, user)
        return Response({"user": me_payload(user), "verification_required": required}, status=201)


class LoginView(AuthView):
    @extend_schema(request=s.LoginSerializer, responses=s.LoginResponseSerializer, tags=["auth"])
    def post(self, request):
        ser = s.LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()
        conf = pleate_settings.AUTH
        window = conf["LOGIN_LOCKOUT_SECONDS"]
        acct_key = f"login:acct:{email}"
        ip_key = f"login:ip:{client_ip(request)}"

        for key, limit in ((acct_key, conf["LOGIN_MAX_ATTEMPTS"]), (ip_key, conf["LOGIN_IP_MAX_ATTEMPTS"])):
            allowed, retry = limits.peek(key, limit, window, fail_closed=True)
            if not allowed:
                raise ApiError(
                    "too_many_attempts",
                    _("Too many attempts. Try again later."),
                    429,
                    {"retry_after": retry},
                )

        user = authenticate(request, email=email, password=ser.validated_data["password"])
        if user is None:
            limits.hit(acct_key, conf["LOGIN_MAX_ATTEMPTS"], window, fail_closed=True)
            limits.hit(ip_key, conf["LOGIN_IP_MAX_ATTEMPTS"], window, fail_closed=True)
            raise ApiError("invalid_credentials", _("Email or password is wrong."), 400)

        limits.reset(acct_key, window)
        if conf["REQUIRE_EMAIL_VERIFICATION"] and not user.email_verified:
            raise ApiError("email_not_verified", _("Confirm your email before signing in."), 403)

        remember = ser.validated_data["remember"]
        for challenge in login_challenges:
            result = challenge(request, user, remember)
            if result:
                return Response({"mfa_required": True, **result})

        complete_login(request, user, remember)
        return Response({"user": me_payload(user), "mfa_required": False})


class LogoutView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses={204: None}, tags=["auth"])
    def post(self, request):
        logout(request)
        return Response(status=204)


class MeView(APIView):
    @extend_schema(responses=s.MeSerializer, tags=["account"])
    def get(self, request):
        return Response(me_payload(request.user))

    @extend_schema(request=s.MeSerializer, responses=s.MeSerializer, tags=["account"])
    def patch(self, request):
        ser = s.MeSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        response = Response(me_payload(request.user))
        if "locale" in ser.validated_data and ser.validated_data["locale"]:
            response.set_cookie(
                "locale", ser.validated_data["locale"], samesite="Lax", max_age=60 * 60 * 24 * 365
            )
        return response

    @extend_schema(request=s.DeleteAccountSerializer, responses={204: None}, tags=["account"])
    def delete(self, request):
        """Deletes the account and, through cascades and signals, every piece of its data."""
        ser = s.DeleteAccountSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        if user.has_password and pleate_settings.AUTH["DELETE_ACCOUNT_REQUIRES_PASSWORD"]:
            if not user.check_password(ser.validated_data.get("password") or ""):
                raise ApiError("wrong_password", _("The password is wrong."), 400)
        elif (ser.validated_data.get("confirm_email") or "").lower() != user.email:
            raise ApiError("confirmation_required", _("Type your email to confirm."), 400)
        signals.account_deleted.send(sender=User, user=user, request=request, email=user.email)
        if user.avatar:
            from pleate_backend.files.storage import get_storage

            get_storage().delete(user.avatar)
        revoke_sessions(user)
        logout(request)
        user.delete()
        return Response(status=204)


class ExportView(APIView):
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        responses=OpenApiResponse(description="JSON file with every piece of the user's data"),
        tags=["account"],
    )
    def get(self, request):
        user = request.user
        data = {"account": me_payload(user), "exported_at": timezone.now().isoformat()}
        for _receiver, result in signals.collect_user_data.send(sender=User, user=user, request=request):
            if result:
                name, section = result
                data[name] = section
        response = Response(data)
        response["Content-Disposition"] = 'attachment; filename="account-export.json"'
        return response


class PasswordChangeView(CsrfProtectedMixin, APIView):
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=s.PasswordChangeSerializer, responses={204: None}, tags=["auth"])
    def post(self, request):
        ser = s.PasswordChangeSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        user = request.user
        user.set_password(ser.validated_data["new_password"])
        user.save()
        update_session_auth_hash(request, user)
        revoke_sessions(user, keep=request.session.session_key)
        signals.password_changed.send(sender=User, user=user, request=request)
        send_security_notice(user, _("The password of your account was changed."))
        return Response(status=204)


class PasswordResetView(AuthView):
    @extend_schema(request=s.EmailSerializer, responses={202: None}, tags=["auth"])
    def post(self, request):
        """Always answers 202, so it does not reveal which emails have an account."""
        ser = s.EmailSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()
        allowed, _retry = limits.hit(f"reset:{email}", 3, 3600)
        user = User.objects.filter(email=email, is_active=True).first()
        if user and allowed:
            send_email(
                "password_reset",
                user.email,
                {
                    "name": user.display_name,
                    "action_url": frontend_url("RESET_PASSWORD", token=make_reset_token(user)),
                    "action_label": _("Choose a new password"),
                    "minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
                },
                _language(user),
            )
        return Response(status=202)


class PasswordResetValidateView(AuthView):
    @extend_schema(request=s.TokenSerializer, responses=s.ValidResponseSerializer, tags=["auth"])
    def post(self, request):
        ser = s.TokenSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        return Response({"valid": read_reset_token(ser.validated_data["token"]) is not None})


class PasswordResetConfirmView(AuthView):
    @extend_schema(request=s.PasswordResetConfirmSerializer, responses={204: None}, tags=["auth"])
    def post(self, request):
        ser = s.PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = read_reset_token(ser.validated_data["token"])
        if user is None:
            raise ApiError("invalid_token", _("This link is not valid anymore. Ask for a new one."), 400)
        try:
            s._validate_new_password(ser.validated_data["new_password"], user)
        except Exception as exc:
            raise s.serializers.ValidationError({"new_password": exc.detail}) from exc
        user.set_password(ser.validated_data["new_password"])
        # The link proves the inbox belongs to the user.
        user.email_verified = True
        user.save()
        revoke_sessions(user)
        limits.reset(f"login:acct:{user.email}", pleate_settings.AUTH["LOGIN_LOCKOUT_SECONDS"])
        signals.password_reset.send(sender=User, user=user, request=request)
        send_security_notice(user, _("The password of your account was reset."))
        return Response(status=204)


class EmailVerifyView(AuthView):
    @extend_schema(request=s.TokenSerializer, responses=s.MeSerializer, tags=["auth"])
    def post(self, request):
        ser = s.TokenSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        payload = read_signed("verify", ser.validated_data["token"])
        user = payload and User.objects.filter(pk=payload["uid"], email=payload["email"]).first()
        if not user:
            raise ApiError("invalid_token", _("This link is not valid anymore. Ask for a new one."), 400)
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified"])
            signals.email_verified.send(sender=User, user=user, request=request)
        return Response(me_payload(user))


class EmailVerifyResendView(CsrfProtectedMixin, APIView):
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=None, responses={202: None}, tags=["auth"])
    def post(self, request):
        if not request.user.email_verified:
            send_verification(request.user)
        return Response(status=202)


class EmailChangeView(CsrfProtectedMixin, APIView):
    throttle_classes = [StrictScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(request=s.EmailChangeSerializer, responses={202: None}, tags=["account"])
    def post(self, request):
        ser = s.EmailChangeSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        user = request.user
        new_email = ser.validated_data["new_email"]
        token = make_signed("email_change", {"uid": str(user.pk), "old": user.email, "new": new_email})
        send_email(
            "email_change",
            new_email,
            {
                "name": user.display_name,
                "new_email": new_email,
                "action_url": frontend_url("CONFIRM_EMAIL_CHANGE", token=token),
                "action_label": _("Confirm new email"),
            },
            _language(user),
        )
        return Response(status=202)


class EmailChangeConfirmView(AuthView):
    @extend_schema(request=s.TokenSerializer, responses=s.MeSerializer, tags=["account"])
    def post(self, request):
        ser = s.TokenSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        payload = read_signed("email_change", ser.validated_data["token"])
        user = payload and User.objects.filter(pk=payload["uid"], email=payload["old"]).first()
        if not user:
            raise ApiError("invalid_token", _("This link is not valid anymore. Ask for a new one."), 400)
        if User.objects.filter(email=payload["new"]).exists():
            raise ApiError("email_taken", _("An account with this email already exists."), 409)
        old = user.email
        user.email = payload["new"]
        user.email_verified = True
        user.save(update_fields=["email", "email_verified"])
        signals.email_changed.send(sender=User, user=user, request=request, old_email=old)
        send_security_notice(
            user, _("The email of your account was changed to %(email)s.") % {"email": user.email}, to=old
        )
        return Response(me_payload(user))


class SessionListView(APIView):
    @extend_schema(responses=s.SessionSerializer(many=True), tags=["account"])
    def get(self, request):
        current = request.session.session_key
        rows = UserSession.objects.filter(user=request.user, expire_date__gt=timezone.now()).order_by(
            "-last_seen_at"
        )
        return Response(
            [
                {
                    "id": public_session_id(row.session_key),
                    "current": row.session_key == current,
                    "ip": row.ip,
                    "user_agent": row.user_agent,
                    **describe_user_agent(row.user_agent),
                    "created_at": row.created_at,
                    "last_seen_at": row.last_seen_at,
                    "expires_at": row.expire_date,
                }
                for row in rows
            ]
        )


class SessionDetailView(CsrfProtectedMixin, APIView):
    @extend_schema(responses={204: None}, tags=["account"])
    def delete(self, request, session_id):
        for row in UserSession.objects.filter(user=request.user).only("session_key"):
            if public_session_id(row.session_key) == session_id:
                if row.session_key == request.session.session_key:
                    logout(request)
                else:
                    row.delete()
                signals.sessions_revoked.send(sender=User, user=request.user, request=request, count=1)
                return Response(status=204)
        raise Http404


class SessionRevokeOthersView(CsrfProtectedMixin, APIView):
    @extend_schema(request=None, responses=s.CountSerializer, tags=["account"])
    def post(self, request):
        count = revoke_sessions(request.user, keep=request.session.session_key)
        signals.sessions_revoked.send(sender=User, user=request.user, request=request, count=count)
        return Response({"count": count})


class AvatarView(CsrfProtectedMixin, APIView):
    parser_classes = [MultiPartParser]

    @extend_schema(
        request={"multipart/form-data": s.AvatarUploadSerializer}, responses=s.MeSerializer, tags=["account"]
    )
    def put(self, request):
        from PIL import Image, ImageOps, UnidentifiedImageError

        from pleate_backend.files.storage import get_storage

        upload = request.FILES.get("file")
        conf = pleate_settings.FILES
        if upload is None:
            raise ApiError("file_required", _("Choose an image."), 400)
        if upload.size > conf["AVATAR_MAX_SIZE"]:
            raise ApiError(
                "file_too_large", _("The image is too large."), 413, {"max_size": conf["AVATAR_MAX_SIZE"]}
            )
        try:
            # Decode the bytes: the declared content type is not trusted.
            image = Image.open(upload)
            image.verify()
            upload.seek(0)
            image = ImageOps.exif_transpose(Image.open(upload)).convert("RGB")
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise ApiError("invalid_image", _("This file is not a valid image."), 400) from exc
        size = conf["AVATAR_DIMENSION"]
        image = ImageOps.fit(image, (size, size))
        buffer = io.BytesIO()
        image.save(buffer, "WEBP", quality=88)
        buffer.seek(0)
        storage = get_storage()
        user = request.user
        old = user.avatar
        user.avatar = storage.save(f"avatars/{user.pk}.webp", buffer)
        user.save(update_fields=["avatar"])
        if old and old != user.avatar:
            storage.delete(old)
        return Response(me_payload(user))

    @extend_schema(responses=s.MeSerializer, tags=["account"])
    def delete(self, request):
        from pleate_backend.files.storage import get_storage

        user = request.user
        if user.avatar:
            get_storage().delete(user.avatar)
            user.avatar = ""
            user.save(update_fields=["avatar"])
        return Response(me_payload(user))


class AvatarImageView(APIView):
    """Serves an avatar. Signed in users only, avatars are not public."""

    throttle_classes = []

    @extend_schema(
        responses={(200, "image/webp"): OpenApiResponse(description="Avatar image")}, tags=["account"]
    )
    def get(self, request, user_id):
        from pleate_backend.files.storage import get_storage

        user = get_object_or_404(User, pk=user_id)
        if not user.avatar:
            raise Http404
        try:
            handle = get_storage().open(user.avatar)
        except FileNotFoundError as exc:
            raise Http404 from exc
        response = FileResponse(handle, content_type="image/webp")
        response["Cache-Control"] = "private, max-age=86400"
        response["X-Content-Type-Options"] = "nosniff"
        return response
