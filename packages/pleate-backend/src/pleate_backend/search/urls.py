from django.urls import path

from . import views as v

app_name = "search"

urlpatterns = [
    path("", v.SearchView.as_view(), name="search"),
]
