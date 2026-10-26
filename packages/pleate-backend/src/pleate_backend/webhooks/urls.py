from django.urls import path

from . import views as v

app_name = "webhooks"

urlpatterns = [
    path("endpoints", v.EndpointListView.as_view(), name="endpoints"),
    path("endpoints/<str:pk>", v.EndpointDetailView.as_view(), name="endpoint"),
    path("endpoints/<str:pk>/rotate-secret", v.RotateSecretView.as_view(), name="endpoint-rotate-secret"),
    path("endpoints/<str:pk>/test", v.TestEndpointView.as_view(), name="endpoint-test"),
    path("endpoints/<str:pk>/deliveries", v.EndpointDeliveriesView.as_view(), name="endpoint-deliveries"),
    path("deliveries/<str:pk>", v.DeliveryDetailView.as_view(), name="delivery"),
    path("deliveries/<str:pk>/redeliver", v.RedeliverView.as_view(), name="delivery-redeliver"),
    path("events", v.EventListView.as_view(), name="events"),
]
