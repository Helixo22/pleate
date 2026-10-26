from django.urls import path

from . import views as v

app_name = "staff"

urlpatterns = [
    path("stats", v.StatsView.as_view(), name="stats"),
    path("users", v.UserListView.as_view(), name="users"),
    path("users/<str:pk>", v.UserDetailView.as_view(), name="user"),
    path("users/<str:pk>/revoke-sessions", v.UserRevokeSessionsView.as_view(), name="user-revoke-sessions"),
    path("users/<str:pk>/password-reset", v.UserPasswordResetView.as_view(), name="user-password-reset"),
    path("bans", v.BanListView.as_view(), name="bans"),
    path("bans/<str:pk>", v.BanDetailView.as_view(), name="ban"),
]
