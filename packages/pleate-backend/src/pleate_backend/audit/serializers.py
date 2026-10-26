from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    actor = serializers.SerializerMethodField()
    changes = serializers.DictField(
        child=serializers.ListField(child=serializers.JSONField(allow_null=True)),
        read_only=True,
        help_text="Field name to [before, after].",
    )
    metadata = serializers.DictField(child=serializers.JSONField(allow_null=True), read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "action",
            "target_type",
            "target_id",
            "target_repr",
            "changes",
            "metadata",
            "ip",
            "user_agent",
            "request_id",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor(self, obj) -> str | None:
        return str(obj.actor_id) if obj.actor_id else None
