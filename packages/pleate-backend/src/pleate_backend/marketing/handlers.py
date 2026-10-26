def export_user_data(sender, user, **kwargs):
    """Newsletter, contact and waitlist rows that match the user's email (or link to the user)."""
    from django.db.models import Q

    from .models import ContactMessage, NewsletterSubscriber, WaitlistEntry

    def when(value):
        return value.isoformat() if value else None

    match = Q(email__iexact=user.email) | Q(user=user)
    newsletter = [
        {
            "email": sub.email,
            "status": sub.status,
            "source": sub.source,
            "locale": sub.locale,
            "created_at": when(sub.created_at),
            "confirmed_at": when(sub.confirmed_at),
            "unsubscribed_at": when(sub.unsubscribed_at),
        }
        for sub in NewsletterSubscriber.objects.filter(match)
    ]
    messages = [
        {
            "name": msg.name,
            "email": msg.email,
            "subject": msg.subject,
            "message": msg.message,
            "created_at": when(msg.created_at),
        }
        for msg in ContactMessage.objects.filter(match).exclude(status=ContactMessage.Status.SPAM)
    ]
    waitlist = [
        {
            "email": e.email,
            "referral_code": e.referral_code,
            "created_at": when(e.created_at),
            "invited_at": when(e.invited_at),
        }
        for e in WaitlistEntry.objects.filter(email__iexact=user.email)
    ]
    return "marketing", {"newsletter": newsletter, "contact_messages": messages, "waitlist": waitlist}
