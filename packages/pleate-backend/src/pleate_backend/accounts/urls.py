from django.urls import path

from . import views as v

app_name = "accounts"

urlpatterns = [
    path("signup", v.SignupView.as_view(), name="signup"),
    path("login", v.LoginView.as_view(), name="login"),
    path("logout", v.LogoutView.as_view(), name="logout"),
    path("me", v.MeView.as_view(), name="me"),
    path("me/export", v.ExportView.as_view(), name="export"),
    path("me/avatar", v.AvatarView.as_view(), name="me-avatar"),
    path("avatars/<str:user_id>", v.AvatarImageView.as_view(), name="avatar"),
    path("password/change", v.PasswordChangeView.as_view(), name="password-change"),
    path("password/reset", v.PasswordResetView.as_view(), name="password-reset"),
    path("password/reset/validate", v.PasswordResetValidateView.as_view(), name="password-reset-validate"),
    path("password/reset/confirm", v.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("email/verify", v.EmailVerifyView.as_view(), name="email-verify"),
    path("email/verify/resend", v.EmailVerifyResendView.as_view(), name="email-verify-resend"),
    path("email/change", v.EmailChangeView.as_view(), name="email-change"),
    path("email/change/confirm", v.EmailChangeConfirmView.as_view(), name="email-change-confirm"),
    path("sessions", v.SessionListView.as_view(), name="sessions"),
    path("sessions/revoke-others", v.SessionRevokeOthersView.as_view(), name="sessions-revoke-others"),
    path("sessions/<str:session_id>", v.SessionDetailView.as_view(), name="session"),
]
