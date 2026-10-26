import unicodedata
from urllib.parse import quote

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.conf import pleate_settings
from pleate_backend.ratelimit.throttles import ScopedRateThrottle

from . import services
from .models import File
from .serializers import (
    FileSerializer,
    FileUpdateSerializer,
    FileUsageSerializer,
    PresignResponseSerializer,
    PresignSerializer,
    UploadSerializer,
)


def content_disposition(disposition: str, name: str) -> str:
    """``attachment; filename="ascii"; filename*=UTF-8''utf8`` (RFC 6266 / RFC 5987)."""
    fallback = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    fallback = "".join(ch for ch in fallback if ch not in '"\\' and 32 <= ord(ch) < 127).strip() or "download"
    return f"{disposition}; filename=\"{fallback}\"; filename*=UTF-8''{quote(name, safe='')}"


class UploadThrottleMixin:
    """The ``upload`` scope applies to POST only, browsing stays on the default rates."""

    throttle_scope = "upload"

    def get_throttles(self):
        throttles = super().get_throttles()
        if self.request.method == "POST":
            throttles.append(ScopedRateThrottle())
        return throttles


class OwnFilesMixin:
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return File.objects.none()
        return File.objects.ready().filter(owner=self.request.user)


@extend_schema_view(
    get=extend_schema(summary="List my files", tags=["files"]),
)
class FileListView(UploadThrottleMixin, OwnFilesMixin, generics.ListAPIView):
    serializer_class = FileSerializer
    search_fields = ["name"]
    filterset_fields = ["content_type", "purpose"]
    ordering_fields = ["created_at", "size", "name"]
    ordering = ["-created_at"]

    @extend_schema(
        summary="Upload a file",
        request={"multipart/form-data": UploadSerializer},
        responses={201: FileSerializer},
        tags=["files"],
    )
    def post(self, request):
        ser = UploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        file = services.save_upload(request.user, ser.validated_data["file"], ser.validated_data["purpose"])
        return Response(FileSerializer(file).data, status=201)


class FileDetailView(OwnFilesMixin, generics.GenericAPIView):
    serializer_class = FileSerializer

    @extend_schema(responses=FileSerializer, tags=["files"])
    def get(self, request, pk):
        return Response(FileSerializer(self.get_object()).data)

    @extend_schema(request=FileUpdateSerializer, responses=FileSerializer, tags=["files"])
    def patch(self, request, pk):
        file = self.get_object()
        ser = FileUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        file.name = ser.validated_data["name"]
        file.save(update_fields=["name"])
        return Response(FileSerializer(file).data)

    @extend_schema(responses={204: None}, tags=["files"])
    def delete(self, request, pk):
        self.get_object().delete()
        return Response(status=204)


class FileDownloadView(OwnFilesMixin, generics.GenericAPIView):
    serializer_class = FileSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "inline", OpenApiTypes.BOOL, description="Display in the browser. Images and PDF only."
            )
        ],
        responses={(200, "application/octet-stream"): OpenApiResponse(OpenApiTypes.BINARY, "File content")},
        tags=["files"],
    )
    def get(self, request, pk):
        file = self.get_object()
        try:
            handle = services.open_file(file)
        except FileNotFoundError as exc:
            raise Http404 from exc
        wants_inline = request.query_params.get("inline") in ("1", "true")
        inline = wants_inline and file.content_type in services.INLINE_TYPES
        response = FileResponse(handle, content_type=file.content_type)
        response["Content-Disposition"] = content_disposition("inline" if inline else "attachment", file.name)
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, max-age=3600"
        if not inline:
            response["Content-Security-Policy"] = "default-src 'none'; sandbox"
        return response


class UsageView(APIView):
    @extend_schema(responses=FileUsageSerializer, tags=["files"])
    def get(self, request):
        files = File.objects.filter(owner=request.user)
        return Response(
            {
                "used": services.usage(request.user),
                "quota": pleate_settings.FILES["USER_QUOTA"],
                "count": files.ready().count(),
            }
        )


class PresignView(UploadThrottleMixin, APIView):
    @extend_schema(request=PresignSerializer, responses={201: PresignResponseSerializer}, tags=["files"])
    def post(self, request):
        ser = PresignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        _file, payload = services.presign_upload(request.user, **ser.validated_data)
        return Response(payload, status=201)


class CompleteView(APIView):
    @extend_schema(request=None, responses=FileSerializer, tags=["files"])
    def post(self, request, pk):
        file = get_object_or_404(File, pk=pk, owner=request.user)
        return Response(FileSerializer(services.complete_upload(file)).data)
