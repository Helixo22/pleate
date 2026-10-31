from django.urls import path

from . import views as v

app_name = "usage"

urlpatterns = [
    path("", v.UsageView.as_view(), name="summary"),
]
