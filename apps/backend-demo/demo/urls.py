from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("pleate_backend.urls")),
    path("api/catalog/", include("demo.catalog.urls")),
]
