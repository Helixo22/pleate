from django.urls import path

from . import views as v

app_name = "oauth"

urlpatterns = [
    path("providers", v.ProvidersView.as_view(), name="providers"),
    path("accounts", v.AccountListView.as_view(), name="accounts"),
    path("accounts/<str:pk>", v.AccountDetailView.as_view(), name="account"),
    path("<str:provider>/start", v.StartView.as_view(), name="start"),
    path("<str:provider>/callback", v.CallbackView.as_view(), name="callback"),
]
