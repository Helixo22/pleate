from datetime import timedelta

from bson import ObjectId
from django.http import Http404
from django.utils import timezone
from django.utils.translation import gettext as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import generics
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.pagination import CursorPagination
from pleate_backend.core.realtime import sse_format, sse_response
from pleate_backend.ratelimit.throttles import ScopedRateThrottle, UserRateThrottle

from . import serializers as s
from . import services
from .models import Conversation, Message

STALE_STREAM = timedelta(minutes=15)

SSE_DESCRIPTION = (
    "Server-Sent Events stream (default). Events, in order: `user_message` {message} (send only), "
    "`start` {message}, then any number of `delta` {text}, `reasoning` {text}, `sources` {sources}, "
    "then `error` {code, message, message_id} when the provider failed, and always `done` {message} last. "
    "Send `Accept: application/json` to get a single JSON response after completion instead."
)


def get_owned(queryset, pk):
    if not ObjectId.is_valid(str(pk)):
        raise Http404
    obj = queryset.filter(pk=pk).first()
    if obj is None:
        raise Http404
    return obj


def wants_json(request) -> bool:
    accept = request.META.get("HTTP_ACCEPT", "")
    return "application/json" in accept and "text/event-stream" not in accept


class EventStreamRenderer(BaseRenderer):
    """Lets DRF accept ``Accept: text/event-stream``. Bodies are streamed by the view."""

    media_type = "text/event-stream"
    format = "sse"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return JSONRenderer().render(data)


class StreamingMixin:
    """JSON or SSE answers, and the ``ai`` throttle scope on POST."""

    renderer_classes = [JSONRenderer, EventStreamRenderer]
    throttle_scope = "ai"

    def get_throttles(self):
        if self.request.method == "POST":
            return [UserRateThrottle(), ScopedRateThrottle()]
        return super().get_throttles()

    def finalize_response(self, request, response, *args, **kwargs):
        # Errors and JSON mode answers are always JSON, even when the client asked for a stream.
        if isinstance(response, Response):
            request.accepted_renderer = JSONRenderer()
            request.accepted_media_type = "application/json"
        return super().finalize_response(request, response, *args, **kwargs)

    def stream(self, events):
        def body():
            try:
                for e in events:
                    yield sse_format(e)
            finally:
                # Client disconnects close the response: let ``generate`` save the partial answer.
                events.close()

        return sse_response(body(), request=self.request)


def drain(events) -> dict | None:
    final = None
    for e in events:
        if e["type"] == "done":
            final = e["data"]["message"]
    return final


# Catalog


class ModelsView(APIView):
    @extend_schema(responses=s.ModelsResponseSerializer, tags=["ai"])
    def get(self, request):
        models = [
            {
                "id": m["id"],
                "name": str(m.get("name") or m["id"]),
                "description": str(m.get("description") or ""),
            }
            for m in services.model_entries()
        ]
        return Response({"models": models, "default": services.default_model_id()})


class SuggestionsView(APIView):
    @extend_schema(responses=s.SuggestionSerializer(many=True), tags=["ai"])
    def get(self, request):
        return Response(s.SuggestionSerializer(pleate_settings.AI["SUGGESTIONS"] or [], many=True).data)


class UsageView(APIView):
    @extend_schema(responses=s.UsageSerializer, tags=["ai"])
    def get(self, request):
        usage = services.usage_today(request.user)
        return Response(
            {
                "today": {
                    "input_tokens": usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "limit": pleate_settings.AI["DAILY_TOKEN_LIMIT"] or None,
                }
            }
        )


# Conversations


class ConversationQuerysetMixin:
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Conversation.objects.none()
        return Conversation.objects.filter(user=self.request.user)

    def get_object(self):
        return get_owned(self.get_queryset(), self.kwargs["pk"])

    @staticmethod
    def check_model(data):
        if data.get("model"):
            services.resolve_model(data["model"])


@extend_schema(tags=["ai"])
class ConversationListView(ConversationQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = s.ConversationSerializer
    search_fields = ["title"]
    filterset_fields = ["archived", "pinned"]
    ordering_fields = ["last_message_at", "created_at", "title"]
    ordering = ["-last_message_at"]

    def perform_create(self, serializer):
        self.check_model(serializer.validated_data)
        model = serializer.validated_data.get("model") or services.default_model_id()
        serializer.save(user=self.request.user, model=model)


@extend_schema(tags=["ai"])
class ConversationDetailView(ConversationQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = s.ConversationSerializer
    http_method_names = ["get", "patch", "delete", "options"]

    def perform_update(self, serializer):
        self.check_model(serializer.validated_data)
        serializer.save()


class MessagePagination(CursorPagination):
    """
    Newest first between pages (``next_cursor`` goes to older messages) but each
    page is returned oldest first, ready to be rendered top to bottom. The client
    prepends older pages as the user scrolls up.
    """

    ordering = ("-created_at", "-id")
    page_size = 50

    def paginate_queryset(self, queryset, request, view=None):
        page = super().paginate_queryset(queryset, request, view)
        return list(reversed(page)) if page is not None else None


class MessagesView(StreamingMixin, generics.ListAPIView):
    serializer_class = s.MessageSerializer
    pagination_class = MessagePagination
    filter_backends: list = []

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Message.objects.none()
        conversation = get_owned(Conversation.objects.filter(user=self.request.user), self.kwargs["pk"])
        return Message.objects.filter(conversation=conversation)

    @extend_schema(
        tags=["ai"],
        description="Cursor paginated. The first page has the latest messages, `next_cursor` loads "
        "older ones. Messages inside a page are in chronological order.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=s.SendMessageSerializer,
        responses={
            (200, "text/event-stream"): OpenApiResponse(OpenApiTypes.STR, description=SSE_DESCRIPTION),
            (201, "application/json"): s.SendResponseSerializer,
        },
        examples=[
            OpenApiExample(
                "Stream",
                value=(
                    'event: user_message\ndata: {"message": {...}}\n\n'
                    'event: start\ndata: {"message": {"status": "streaming", ...}}\n\n'
                    'event: delta\ndata: {"text": "Hello"}\n\n'
                    'event: done\ndata: {"message": {"status": "complete", ...}}\n\n'
                ),
                response_only=True,
                status_codes=["200"],
                media_type="text/event-stream",
            )
        ],
        tags=["ai"],
    )
    def post(self, request, pk):
        """Sends a message and streams the answer."""
        conversation = get_owned(Conversation.objects.filter(user=request.user), pk)
        ser = s.SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        content = data["content"]
        if not content.strip() and not data["attachments"]:
            raise ApiError("empty_message", _("Write a message or attach a file."), 400)
        entry = services.resolve_model(data.get("model") or conversation.model)
        attachments = services.validate_attachments(request.user, data["attachments"])
        services.check_quota(request.user)

        now = timezone.now()
        user_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=content,
            attachments=attachments,
            created_at=now,
        )
        assistant = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            status=Message.Status.STREAMING,
            model=entry["id"],
            created_at=now + timedelta(milliseconds=1),
        )
        updates = {"last_message_at": now}
        if conversation.model != entry["id"]:
            updates["model"] = entry["id"]
        Conversation.objects.filter(pk=conversation.pk).update(**updates)
        for key, value in updates.items():
            setattr(conversation, key, value)

        history = services.build_history(conversation, assistant)
        events = services.generate(conversation, assistant, history, entry, user_message=user_message)
        if wants_json(request):
            final = drain(events)
            return Response(
                {"user_message": s.MessageSerializer(user_message).data, "assistant_message": final},
                status=201,
            )
        return self.stream(events)


class MessageMixin:
    def get_message(self, request, pk) -> Message:
        message = get_owned(Message.objects.select_related("conversation"), pk)
        if message.conversation.user_id != request.user.pk:
            raise Http404
        return message


class RegenerateView(MessageMixin, StreamingMixin, APIView):
    @extend_schema(
        request=s.RegenerateSerializer,
        responses={
            (200, "text/event-stream"): OpenApiResponse(OpenApiTypes.STR, description=SSE_DESCRIPTION),
            (200, "application/json"): s.RegenerateResponseSerializer,
        },
        tags=["ai"],
    )
    def post(self, request, pk):
        """Answers again the last assistant message. The previous answer is kept in ``variants``."""
        message = self.get_message(request, pk)
        conversation = message.conversation
        last = Message.objects.filter(conversation=conversation).order_by("-created_at", "-id").first()
        if message.role != Message.Role.ASSISTANT or last is None or last.pk != message.pk:
            raise ApiError("cannot_regenerate", _("Only the last answer can be regenerated."), 409)
        if message.status == Message.Status.STREAMING:
            raise ApiError("message_streaming", _("This answer is still being written."), 409)
        ser = s.RegenerateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        entry = services.resolve_model(ser.validated_data.get("model") or message.model or conversation.model)
        services.check_quota(request.user)

        if message.content:
            message.variants = [*(message.variants or []), message.content]
        message.content = ""
        message.reasoning = ""
        message.sources = []
        message.error_code = ""
        message.status = Message.Status.STREAMING
        message.model = entry["id"]
        message.save()

        history = services.build_history(conversation, message)
        events = services.generate(conversation, message, history, entry)
        if wants_json(request):
            return Response({"assistant_message": drain(events)})
        return self.stream(events)


class StopView(MessageMixin, APIView):
    @extend_schema(request=None, responses={202: s.MessageSerializer}, tags=["ai"])
    def post(self, request, pk):
        """Asks the running generation to stop. The stream then ends with ``done`` and status ``stopped``."""
        message = self.get_message(request, pk)
        if message.status == Message.Status.STREAMING:
            services.request_stop(message.pk)
            if timezone.now() - message.created_at > STALE_STREAM:
                # Nothing is writing this message any more (worker restarted).
                message.status = Message.Status.STOPPED
                message.save(update_fields=["status"])
        return Response(s.MessageSerializer(message).data, status=202)
