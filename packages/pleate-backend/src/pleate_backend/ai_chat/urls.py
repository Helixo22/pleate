from django.urls import path

from . import views as v

app_name = "ai_chat"

urlpatterns = [
    path("models", v.ModelsView.as_view(), name="models"),
    path("suggestions", v.SuggestionsView.as_view(), name="suggestions"),
    path("usage", v.UsageView.as_view(), name="usage"),
    path("conversations", v.ConversationListView.as_view(), name="conversations"),
    path("conversations/<str:pk>", v.ConversationDetailView.as_view(), name="conversation"),
    path("conversations/<str:pk>/messages", v.MessagesView.as_view(), name="messages"),
    path("messages/<str:pk>/stop", v.StopView.as_view(), name="stop"),
    path("messages/<str:pk>/regenerate", v.RegenerateView.as_view(), name="regenerate"),
]
