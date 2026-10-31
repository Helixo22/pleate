from django.utils.translation import gettext as _
from rest_framework import serializers

from .services import available_types


class SearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(min_length=2, max_length=100)
    types = serializers.CharField(
        required=False, help_text="Comma separated: files, conversations, notifications. Default all."
    )
    limit = serializers.IntegerField(min_value=1, max_value=10, default=5, help_text="Per type.")

    def validate_types(self, value):
        names = list(dict.fromkeys(t.strip() for t in value.split(",") if t.strip()))
        allowed = available_types()
        unknown = [n for n in names if n not in allowed]
        if unknown or not names:
            raise serializers.ValidationError(
                _("Unknown type: %(type)s.") % {"type": (unknown or [value])[0]}, code="invalid_type"
            )
        return names


class SearchResultSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["files", "conversations", "notifications"])
    id = serializers.CharField()
    title = serializers.CharField()
    subtitle = serializers.CharField(allow_null=True)
    url = serializers.CharField()
