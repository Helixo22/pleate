from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SearchQuerySerializer, SearchResultSerializer
from .services import available_types, search


class SearchView(APIView):
    @extend_schema(
        parameters=[SearchQuerySerializer], responses=SearchResultSerializer(many=True), tags=["search"]
    )
    def get(self, request):
        ser = SearchQuerySerializer(data=request.query_params)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        return Response(
            search(request.user, data["q"], data.get("types") or available_types(), data["limit"])
        )
