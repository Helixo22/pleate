from django.urls import path

from . import views as v

app_name = "billing"

urlpatterns = [
    path("plans", v.PlansView.as_view(), name="plans"),
    path("subscription", v.SubscriptionView.as_view(), name="subscription"),
    path("checkout", v.CheckoutView.as_view(), name="checkout"),
    path("portal", v.PortalView.as_view(), name="portal"),
    path("webhook", v.WebhookView.as_view(), name="webhook"),
]
