from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "sku", "category", "price", "stock", "status"]
    list_filter = ["status", "category"]
    search_fields = ["name", "sku"]
