from drf_spectacular.extensions import OpenApiAuthenticationExtension


class SessionScheme(OpenApiAuthenticationExtension):
    target_class = "pleate_backend.accounts.authentication.SessionAuthentication"
    name = "session"

    def get_security_definition(self, auto_schema):
        return {"type": "apiKey", "in": "cookie", "name": "sessionid"}


class APIKeyScheme(OpenApiAuthenticationExtension):
    target_class = "pleate_backend.apikeys.authentication.APIKeyAuthentication"
    name = "apiKey"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "description": "Personal API key, `Authorization: Bearer pl_...`",
        }


def drop_slash_twins(endpoints, **kwargs):
    """Collections answer at /api/files and /api/files/; document only the first."""
    paths = {path for path, *_ in endpoints}
    return [e for e in endpoints if not (e[0].endswith("/") and e[0].rstrip("/") in paths)]
