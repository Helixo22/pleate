from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import File
from .services import sanitize_name


@extend_schema_field({"type": "string", "enum": [s.value for s in File.Status]})
class FileStatusField(serializers.CharField):
    """Inline enum, keeps the schema free of a shared ``StatusEnum`` component."""


class FileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    status = FileStatusField(read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            "id",
            "name",
            "size",
            "content_type",
            "checksum",
            "width",
            "height",
            "purpose",
            "status",
            "created_at",
            "download_url",
        ]
        read_only_fields = fields

    def get_download_url(self, file) -> str:
        return reverse("files:download", kwargs={"pk": str(file.pk)})


class FileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)

    def validate_name(self, value):
        return sanitize_name(value)


class UploadSerializer(serializers.Serializer):
    file = serializers.FileField(error_messages={"required": _("Choose a file.")})
    purpose = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")


class FileUsageSerializer(serializers.Serializer):
    used = serializers.IntegerField()
    quota = serializers.IntegerField(allow_null=True)
    count = serializers.IntegerField()


class PresignSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    size = serializers.IntegerField(min_value=1)
    content_type = serializers.CharField(max_length=127)
    purpose = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")


class PresignResponseSerializer(serializers.Serializer):
    file_id = serializers.CharField()
    upload_url = serializers.URLField()
    fields = serializers.DictField(child=serializers.CharField())
    expires_in = serializers.IntegerField()
