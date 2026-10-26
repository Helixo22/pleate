from django.db import models

from pleate_backend.core.models import TimestampedModel


class Product(TimestampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DRAFT = "draft", "Draft"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=40, unique=True)
    category = models.CharField(max_length=60, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
