from django.urls import path

from . import views as v

app_name = "rbac"

urlpatterns = [
    path("roles", v.RoleListView.as_view(), name="roles"),
    path("roles/<str:pk>", v.RoleDetailView.as_view(), name="role"),
    path("permissions", v.PermissionListView.as_view(), name="permissions"),
    path("users/<str:user_id>/roles", v.UserRolesView.as_view(), name="user-roles"),
    path("features", v.FeatureListView.as_view(), name="features"),
    path("features/me", v.MyFeaturesView.as_view(), name="my-features"),
    path("features/<str:pk>", v.FeatureDetailView.as_view(), name="feature"),
]
