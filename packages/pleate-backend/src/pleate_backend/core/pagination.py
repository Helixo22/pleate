"""
List conventions shared by every collection endpoint.

Page mode (default), good for Table + Pagination:

    GET /api/things?page=2&page_size=20&ordering=-created_at&search=foo&status=open
    {"results": [...], "count": 134, "page": 2, "page_size": 20, "page_count": 7}

Cursor mode, good for infinite lists (chat, notifications, activity):

    GET /api/things?cursor=<opaque>&page_size=20
    {"results": [...], "next_cursor": "...", "previous_cursor": null}
"""

import math

from django.core.paginator import InvalidPage
from rest_framework import pagination
from rest_framework.response import Response

from .exceptions import ApiError


class PagePagination(pagination.PageNumberPagination):
    page_query_param = "page"
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        try:
            return super().paginate_queryset(queryset, request, view)
        except pagination.NotFound as exc:
            raise ApiError("invalid_page", str(exc.detail), 404) from exc

    def get_paginated_response(self, data):
        page_size = self.page.paginator.per_page
        count = self.page.paginator.count
        return Response(
            {
                "results": data,
                "count": count,
                "page": self.page.number,
                "page_size": page_size,
                "page_count": max(1, math.ceil(count / page_size)) if page_size else 1,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": ["results", "count", "page", "page_size", "page_count"],
            "properties": {
                "results": schema,
                "count": {"type": "integer", "example": 134},
                "page": {"type": "integer", "example": 2},
                "page_size": {"type": "integer", "example": 20},
                "page_count": {"type": "integer", "example": 7},
            },
        }


class CursorPagination(pagination.CursorPagination):
    cursor_query_param = "cursor"
    page_size_query_param = "page_size"
    max_page_size = 100
    ordering = "-created_at"

    def get_paginated_response(self, data):
        return Response(
            {
                "results": data,
                "next_cursor": self._cursor_value(self.get_next_link()),
                "previous_cursor": self._cursor_value(self.get_previous_link()),
            }
        )

    def _cursor_value(self, link):
        if not link:
            return None
        from urllib.parse import parse_qs, urlparse

        return parse_qs(urlparse(link).query).get(self.cursor_query_param, [None])[0]

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": ["results", "next_cursor", "previous_cursor"],
            "properties": {
                "results": schema,
                "next_cursor": {"type": "string", "nullable": True},
                "previous_cursor": {"type": "string", "nullable": True},
            },
        }


__all__ = ["PagePagination", "CursorPagination", "InvalidPage"]
