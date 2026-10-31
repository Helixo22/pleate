from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UsageSummarySerializer
from .services import usage_summary


class UsageView(APIView):
    @extend_schema(responses=UsageSummarySerializer, tags=["usage"])
    def get(self, request):
        return Response(usage_summary(request.user))
