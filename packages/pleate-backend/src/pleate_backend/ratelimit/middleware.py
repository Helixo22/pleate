class RateLimitHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        info = getattr(request, "_pleate_ratelimit", None)
        if info:
            response["RateLimit-Limit"] = str(info["limit"])
            response["RateLimit-Remaining"] = str(info["remaining"])
            response["RateLimit-Reset"] = str(info["reset"])
        return response
