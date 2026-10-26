"""Session engine that stores ``UserSession`` documents.

``SESSION_ENGINE = "pleate_backend.accounts.sessions"``
"""

from django.contrib.auth import SESSION_KEY
from django.contrib.sessions.backends.db import SessionStore as DBStore


class SessionStore(DBStore):
    @classmethod
    def get_model_class(cls):
        from .models import UserSession

        return UserSession

    def create_model_instance(self, data):
        obj = super().create_model_instance(data)
        uid = data.get(SESSION_KEY)
        if uid:
            obj.user_id = obj._meta.get_field("user").to_python(uid)
        meta = getattr(self, "client_meta", None)
        if meta:
            obj.ip = meta.get("ip", "")
            obj.user_agent = meta.get("user_agent", "")
        try:
            previous = self.model.objects.only("created_at").get(session_key=self.session_key)
            obj.created_at = previous.created_at
        except self.model.DoesNotExist:
            pass
        return obj
