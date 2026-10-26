from django.urls import path

from . import views as v

app_name = "apikeys"

urlpatterns = [
    path("", v.APIKeyListView.as_view(), name="keys"),
    path("<str:pk>", v.APIKeyDetailView.as_view(), name="key"),
]
