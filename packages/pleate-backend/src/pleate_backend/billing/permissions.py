from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission

from .services import active_subscription


class HasActiveSubscription(BasePermission):
    """
    Requires an active (or trialing, or past due) subscription.

        permission_classes = [HasActiveSubscription]                    # any plan
        permission_classes = [HasActiveSubscription(plans=["pro"])]     # these plans only

    Denied requests get 403 ``subscription_required``.
    """

    plans: list[str] | None = None
    message = _("This feature needs a subscription.")
    code = "subscription_required"

    def __new__(cls, *args, plans=None, **kwargs):
        if plans is not None:
            # Class factory: returns a subclass bound to ``plans`` for permission_classes.
            return type(cls)(cls.__name__, (cls,), {"plans": list(plans)})
        return super().__new__(cls)

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        sub = active_subscription(user)
        if sub is None:
            return False
        return self.plans is None or sub.plan_id in self.plans
