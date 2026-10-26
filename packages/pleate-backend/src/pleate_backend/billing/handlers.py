def cancel_on_delete(sender, instance, **kwargs):
    """Account deletion: stop charging the user. Errors are logged, never raised."""
    from .services import cancel_user_subscriptions

    cancel_user_subscriptions(instance)


def export_user_data(sender, user, **kwargs):
    from .models import Customer, Subscription

    def when(value):
        return value.isoformat() if value else None

    customer = Customer.objects.filter(user=user).first()
    subscriptions = [
        {
            "plan_id": sub.plan_id,
            "interval": sub.interval,
            "status": sub.status,
            "current_period_end": when(sub.current_period_end),
            "cancel_at_period_end": sub.cancel_at_period_end,
            "trial_end": when(sub.trial_end),
            "created_at": when(sub.created_at),
        }
        for sub in Subscription.objects.filter(user=user)
    ]
    return "billing", {
        "customer_id": customer.stripe_customer_id if customer else None,
        "subscriptions": subscriptions,
    }
