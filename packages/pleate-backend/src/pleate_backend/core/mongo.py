"""Helpers for things the Django ORM does not express, such as TTL indexes."""

from django.db import connection


def collection(model):
    return connection.get_collection(model._meta.db_table)


def ensure_ttl_index(model, field: str, seconds: int):
    """
    Make MongoDB delete documents ``seconds`` after ``field``. Reuses an
    existing single field index (for example one created by ``db_index``) and
    updates the delay when it changed. Safe to call on every migrate.
    """
    coll = collection(model)
    for name, info in coll.index_information().items():
        if info.get("key") == [(field, 1)]:
            if info.get("expireAfterSeconds") != seconds:
                connection.database.command(
                    "collMod", model._meta.db_table, index={"name": name, "expireAfterSeconds": seconds}
                )
            return
    coll.create_index(field, name=f"{field}_ttl", expireAfterSeconds=seconds)
