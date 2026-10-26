"""``python manage.py seed``: demo users, roles, products and notifications."""

import random
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

from demo.catalog.models import Product
from pleate_backend.notifications.models import Notification
from pleate_backend.notifications.services import notify

PASSWORD = "plate-demo-2026"
CATEGORIES = ["Kitchen", "Office", "Outdoor", "Audio", "Lighting", "Travel"]
ADJECTIVES = ["Linen", "Oak", "Matte", "Compact", "Classic", "Studio", "Nordic", "Soft"]
NOUNS = ["Lamp", "Mug", "Backpack", "Speaker", "Notebook", "Chair", "Bottle", "Tray", "Clock", "Desk Mat"]


class Command(BaseCommand):
    help = "Creates demo data. Safe to run twice."

    def handle(self, *args, **options):
        User = get_user_model()
        ada, created = User.objects.get_or_create(
            email="ada@plate.dev",
            defaults={"name": "Ada Lovelace", "email_verified": True, "is_staff": True, "is_superuser": True},
        )
        if created:
            ada.set_password(PASSWORD)
            ada.save()
        for name in ["Grace Hopper", "Alan Turing", "Katherine Johnson", "Linus Pauling"]:
            email = name.split()[0].lower() + "@plate.dev"
            user, made = User.objects.get_or_create(
                email=email, defaults={"name": name, "email_verified": True}
            )
            if made:
                user.set_password(PASSWORD)
                user.save()

        editors, _ = Group.objects.get_or_create(name="editor")
        editors.permissions.set(
            Permission.objects.filter(codename__in=["change_product", "add_product", "delete_product"])
        )

        if not Product.objects.exists():
            rng = random.Random(7)
            Product.objects.bulk_create(
                [
                    Product(
                        name=f"{rng.choice(ADJECTIVES)} {rng.choice(NOUNS)}",
                        sku=f"PL-{1000 + i}",
                        category=rng.choice(CATEGORIES),
                        price=Decimal(rng.randrange(900, 24900)) / 100,
                        stock=rng.randrange(0, 200),
                        status=rng.choice(["active"] * 6 + ["draft", "archived"]),
                    )
                    for i in range(120)
                ]
            )

        if not Notification.objects.filter(user=ada).exists():
            notify(ada, "welcome", "Welcome to Plate", "Your workspace is ready.", url="/")
            notify(ada, "billing", "Invoice paid", "Your Pro plan was renewed.", url="/settings/billing")
            notify(ada, "team", "Grace joined your team", "Say hi to Grace Hopper.")

        self.stdout.write(self.style.SUCCESS(f"Seeded. Log in as ada@plate.dev / {PASSWORD}"))
