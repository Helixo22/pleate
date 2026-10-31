from rest_framework import serializers


class UsageItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField()
    used = serializers.IntegerField()
    limit = serializers.IntegerField(allow_null=True)
    unit = serializers.CharField()


class UsageSummarySerializer(serializers.Serializer):
    plan = serializers.CharField(allow_null=True)
    items = UsageItemSerializer(many=True)
