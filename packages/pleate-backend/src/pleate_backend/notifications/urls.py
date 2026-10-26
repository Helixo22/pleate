from django.urls import path

from . import views as v

app_name = "notifications"

urlpatterns = [
    path("", v.NotificationListView.as_view(), name="list"),
    path("unread-count", v.UnreadCountView.as_view(), name="unread-count"),
    path("read-all", v.ReadAllView.as_view(), name="read-all"),
    path("preferences", v.PreferencesView.as_view(), name="preferences"),
    path("stream", v.StreamView.as_view(), name="stream"),
    path("push/public-key", v.PushPublicKeyView.as_view(), name="push-public-key"),
    path("push/subscriptions", v.PushSubscriptionView.as_view(), name="push-subscriptions"),
    path("<str:pk>", v.NotificationDetailView.as_view(), name="detail"),
    path("<str:pk>/read", v.MarkReadView.as_view(), name="read"),
    path("<str:pk>/unread", v.MarkUnreadView.as_view(), name="unread"),
]
