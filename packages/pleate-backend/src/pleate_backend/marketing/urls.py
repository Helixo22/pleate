from django.urls import path

from . import views as v

app_name = "marketing"

urlpatterns = [
    path("newsletter/subscribe", v.SubscribeView.as_view(), name="newsletter-subscribe"),
    path("newsletter/confirm", v.ConfirmView.as_view(), name="newsletter-confirm"),
    path("newsletter/unsubscribe", v.UnsubscribeView.as_view(), name="newsletter-unsubscribe"),
    path("subscribers", v.SubscriberListView.as_view(), name="subscribers"),
    path("subscribers/export", v.SubscriberExportView.as_view(), name="subscribers-export"),
    path("contact", v.ContactView.as_view(), name="contact"),
    path("contact-messages", v.ContactMessageListView.as_view(), name="contact-messages"),
    path("contact-messages/<str:pk>", v.ContactMessageDetailView.as_view(), name="contact-message"),
    path("waitlist", v.WaitlistView.as_view(), name="waitlist"),
    path("waitlist/<str:pk>/invite", v.WaitlistInviteView.as_view(), name="waitlist-invite"),
    path("waitlist/<str:referral_code>", v.WaitlistStatusView.as_view(), name="waitlist-status"),
]
