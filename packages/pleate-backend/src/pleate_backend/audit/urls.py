from django.urls import path

from . import views as v

app_name = "audit"

urlpatterns = [
    path("", v.MyActivityView.as_view(), name="mine"),
    path("all", v.ActivityListView.as_view(), name="all"),
    path("all/<str:pk>", v.ActivityDetailView.as_view(), name="detail"),
]
