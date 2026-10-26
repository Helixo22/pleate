from rest_framework import authentication


class SessionAuthentication(authentication.SessionAuthentication):
    """DRF session auth that answers 401 (not 403) to anonymous requests."""

    def authenticate_header(self, request):
        return 'Session realm="api"'
