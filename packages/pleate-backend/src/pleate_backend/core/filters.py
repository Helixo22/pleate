"""
``search`` and ``ordering`` query params. Views declare what is allowed:

    search_fields = ["name", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]
    filterset_fields = ["status"]          # django-filter, exact match
"""

from django.utils.translation import gettext as _
from rest_framework import filters

from .exceptions import ApiError


class SearchFilter(filters.SearchFilter):
    search_param = "search"


class OrderingFilter(filters.OrderingFilter):
    ordering_param = "ordering"

    def get_ordering(self, request, queryset, view):
        params = request.query_params.get(self.ordering_param)
        if params:
            requested = [p.strip() for p in params.split(",") if p.strip()]
            valid = self.remove_invalid_fields(queryset, requested, view, request)
            if len(valid) != len(requested):
                message = _("Ordering by '%(ordering)s' is not allowed.") % {"ordering": params}
                raise ApiError("invalid_ordering", message, 400)
            if valid:
                return valid
        return self.get_default_ordering(view)
