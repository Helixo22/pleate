from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from pleate_backend.core.conf import pleate_settings

from .models import Conversation, DailyUsage, Message

DEFAULT_MAX_MESSAGE_CHARS = 32_000
DEFAULT_MAX_ATTACHMENTS = 10


def ai_setting(key, default=None):
    return pleate_settings.AI.get(key, default)


class SourceSerializer(serializers.Serializer):
    title = serializers.CharField()
    url = serializers.CharField()
    snippet = serializers.CharField(allow_blank=True)


class AttachmentSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    content_type = serializers.CharField()
    size = serializers.IntegerField()


def attachment_details(ids: list[str]) -> list[dict]:
    """Name, type and size of the attached files, in order. Missing files keep their id only."""
    if not ids:
        return []
    found: dict = {}
    try:
        from pleate_backend.files.models import File

        for f in File.objects.filter(pk__in=ids).only("id", "name", "content_type", "size"):
            found[str(f.pk)] = {
                "id": str(f.pk),
                "name": f.name,
                "content_type": f.content_type,
                "size": f.size,
            }
    except Exception:  # files app missing or ids not valid any more
        pass
    return [found.get(i) or {"id": i, "name": "", "content_type": "", "size": 0} for i in ids]


class MessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    conversation = serializers.CharField(source="conversation_id", read_only=True)
    sources = SourceSerializer(many=True, read_only=True)
    attachments = serializers.SerializerMethodField()
    variants = serializers.ListField(child=serializers.CharField(allow_blank=True), read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "role",
            "content",
            "reasoning",
            "status",
            "error_code",
            "model",
            "sources",
            "attachments",
            "variants",
            "input_tokens",
            "output_tokens",
            "created_at",
        ]
        read_only_fields = fields

    @extend_schema_field(AttachmentSerializer(many=True))
    def get_attachments(self, message):
        return attachment_details(message.attachments or [])


class ConversationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    model = serializers.CharField(max_length=100, required=False, allow_blank=True)
    system_prompt = serializers.CharField(max_length=8000, required=False, allow_blank=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "model",
            "system_prompt",
            "pinned",
            "archived",
            "created_at",
            "updated_at",
            "last_message_at",
        ]
        read_only_fields = ["created_at", "updated_at", "last_message_at"]


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True, default="", trim_whitespace=False)
    attachments = serializers.ListField(
        child=serializers.CharField(max_length=64), required=False, default=list
    )
    model = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_content(self, value):
        limit = ai_setting("MAX_MESSAGE_CHARS", DEFAULT_MAX_MESSAGE_CHARS)
        if len(value) > limit:
            raise serializers.ValidationError(
                _("Messages can have at most %(limit)s characters.") % {"limit": limit},
                code="message_too_long",
            )
        return value

    def validate_attachments(self, value):
        limit = ai_setting("MAX_ATTACHMENTS", DEFAULT_MAX_ATTACHMENTS)
        if len(value) > limit:
            raise serializers.ValidationError(
                _("Attach at most %(limit)s files.") % {"limit": limit}, code="too_many_attachments"
            )
        return list(dict.fromkeys(value))


class RegenerateSerializer(serializers.Serializer):
    model = serializers.CharField(required=False, allow_blank=True, max_length=100)


class SendResponseSerializer(serializers.Serializer):
    user_message = MessageSerializer()
    assistant_message = MessageSerializer()


class RegenerateResponseSerializer(serializers.Serializer):
    assistant_message = MessageSerializer()


class ModelOptionSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True)


class ModelsResponseSerializer(serializers.Serializer):
    models = ModelOptionSerializer(many=True)
    default = serializers.CharField()


class SuggestionSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    prompt = serializers.CharField()


class UsageDaySerializer(serializers.Serializer):
    input_tokens = serializers.IntegerField()
    output_tokens = serializers.IntegerField()
    limit = serializers.IntegerField(allow_null=True)


class UsageSerializer(serializers.Serializer):
    today = UsageDaySerializer()


class DailyUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyUsage
        fields = ["day", "input_tokens", "output_tokens"]
