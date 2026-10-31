def export_user_data(sender, user, **kwargs):
    """Rows linked to the user, plus rows that match its email once that email is verified."""
    from django.db.models import Q

    from .models import ContactMessage, NewsletterSubscriber, WaitlistEntry

    def when(value):
        return value.isoformat() if value else None

    # An unverified email may belong to someone else: matching on it would leak their rows.
    by_email = Q(email__iexact=user.email) if user.email_verified else Q(pk__in=[])
    match = by_email | Q(user=user)
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
        for e in WaitlistEntry.objects.filter(by_email)
    ]
    return "marketing", {"newsletter": newsletter, "contact_messages": messages, "waitlist": waitlist}
