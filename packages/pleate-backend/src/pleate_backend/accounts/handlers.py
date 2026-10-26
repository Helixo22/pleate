from pleate_backend.core.mongo import ensure_ttl_index


def ensure_indexes(**kwargs):
    from .models import UserSession

    # MongoDB drops sessions as soon as they expire.
    ensure_ttl_index(UserSession, "expire_date", 0)
