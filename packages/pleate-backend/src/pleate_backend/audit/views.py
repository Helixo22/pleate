import django_filters
from bson import ObjectId
from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics

from pleate_backend.core.filters import OrderingFilter, SearchFilter
from pleate_backend.core.pagination import CursorPagination, PagePagination
from pleate_backend.core.permissions import IsStaff

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class MyActivityFilter(django_filters.FilterSet):
    action = django_filters.CharFilter(field_name="action", help_text="Exact action, for example auth.login.")
    action__startswith = django_filters.CharFilter(
        field_name="action", lookup_expr="startswith", help_text="Action prefix, for example auth."
    )

    class Meta:
        model = ActivityLog
        fields = []


class ActivityFilter(MyActivityFilter):
    actor = django_filters.CharFilter(method="filter_actor", help_text="User id.")
    target_type = django_filters.CharFilter(field_name="target_type")
    target_id = django_filters.CharFilter(field_name="target_id")
    created_after = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lt")

    def filter_actor(self, queryset, name, value):
        if not ObjectId.is_valid(value):
            return queryset.none()
        return queryset.filter(actor_id=ObjectId(value))


class ActivityCursorPagination(CursorPagination):
    ordering = "-created_at"


@extend_schema_view(get=extend_schema(tags=["activity"], summary="My activity, newest first"))
class MyActivityView(generics.ListAPIView):
    """What the signed in user did: logins, password changes, edits..."""

    serializer_class = ActivityLogSerializer
    pagination_class = ActivityCursorPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = MyActivityFilter

    def get_queryset(self):
        return ActivityLog.objects.filter(actor_id=self.request.user.pk)


@extend_schema_view(get=extend_schema(tags=["activity"], summary="Every activity entry (staff)"))
class ActivityListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsStaff]
    pagination_class = PagePagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ActivityFilter
    search_fields = ["actor_email", "target_repr", "action"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]
    queryset = ActivityLog.objects.all()


@extend_schema_view(get=extend_schema(tags=["activity"], summary="One activity entry (staff)"))
class ActivityDetailView(generics.RetrieveAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsStaff]
    queryset = ActivityLog.objects.all()

    def get_object(self):
        pk = self.kwargs["pk"]
        if not ObjectId.is_valid(pk):
            raise Http404
        return super().get_object()
