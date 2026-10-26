from django.urls import path

from . import views as v

app_name = "files"

urlpatterns = [
    path("", v.FileListView.as_view(), name="list"),
    path("usage", v.UsageView.as_view(), name="usage"),
    path("presign", v.PresignView.as_view(), name="presign"),
    path("<str:pk>", v.FileDetailView.as_view(), name="detail"),
    path("<str:pk>/download", v.FileDownloadView.as_view(), name="download"),
    path("<str:pk>/complete", v.CompleteView.as_view(), name="complete"),
]
