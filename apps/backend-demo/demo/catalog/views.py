"""
A plain DRF ViewSet. Pagination, ``search``, ``ordering`` and field filters
come from the pleate-backend defaults, the view only declares what is
allowed. This is all a DataTable needs.
"""

import django_filters
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from pleate_backend.rbac.permissions import HasPerm

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "sku", "category", "price", "stock", "status", "created_at", "updated_at"]


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    low_stock = django_filters.BooleanFilter(method="filter_low_stock")

    class Meta:
        model = Product
        fields = ["status", "category"]

    def filter_low_stock(self, queryset, name, value):
        return queryset.filter(stock__lt=10) if value else queryset


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "category"]
    ordering_fields = ["name", "price", "stock", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        # Everyone signed in can read, writing needs the model permission.
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), HasPerm("catalog.change_product")()]
