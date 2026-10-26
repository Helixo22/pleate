from django.urls import path

from .views import CsrfView, HealthView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("csrf", CsrfView.as_view(), name="csrf"),
]
