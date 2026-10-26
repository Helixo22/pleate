from django.urls import path

from . import views as v

app_name = "mfa"

urlpatterns = [
    path("", v.StatusView.as_view(), name="status"),
    path("setup", v.SetupView.as_view(), name="setup"),
    path("confirm", v.ConfirmView.as_view(), name="confirm"),
    path("disable", v.DisableView.as_view(), name="disable"),
    path("backup-codes", v.BackupCodesView.as_view(), name="backup-codes"),
    path("verify", v.VerifyView.as_view(), name="verify"),
]
