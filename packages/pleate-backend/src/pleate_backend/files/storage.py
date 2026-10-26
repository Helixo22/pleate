"""
Django storage backends.

``GridFSStorage`` keeps blobs in MongoDB GridFS, next to the data, so a
project needs nothing else to start. For larger volumes switch
``PLEATE["FILES"]["STORAGE"]`` to ``storages.backends.s3.S3Storage``
(``pip install pleate-backend[s3]``) and configure django-storages.
"""

import io
import os
import uuid

from django.core.files.base import File
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from django.utils.module_loading import import_string

from pleate_backend.core.conf import pleate_settings


@deconstructible
class GridFSStorage(Storage):
    def __init__(self, bucket: str = "pleate_files"):
        self.bucket_name = bucket

    @property
    def _bucket(self):
        import gridfs
        from django.db import connection

        connection.ensure_connection()
        return gridfs.GridFSBucket(connection.database, bucket_name=self.bucket_name)

    def _find(self, name):
        return next(iter(self._bucket.find({"filename": name}).sort("uploadDate", -1).limit(1)), None)

    def _open(self, name, mode="rb"):
        doc = self._find(name)
        if doc is None:
            raise FileNotFoundError(name)
        stream = self._bucket.open_download_stream(doc._id)
        return File(io.BytesIO(stream.read()), name=name)

    def _save(self, name, content):
        content.seek(0)
        self._bucket.upload_from_stream(name, content)
        return name

    def get_available_name(self, name, max_length=None):
        root, ext = os.path.splitext(name)
        return f"{root}-{uuid.uuid4().hex[:12]}{ext}" if self.exists(name) else name

    def delete(self, name):
        for doc in self._bucket.find({"filename": name}):
            self._bucket.delete(doc._id)

    def exists(self, name):
        return self._find(name) is not None

    def size(self, name):
        doc = self._find(name)
        if doc is None:
            raise FileNotFoundError(name)
        return doc.length

    def url(self, name):
        # Served by the API with access control, never a public URL.
        return None


_storage = None
_storage_path = None


def get_storage() -> Storage:
    global _storage, _storage_path
    path = pleate_settings.FILES["STORAGE"]
    if _storage is None or path != _storage_path:
        _storage = import_string(path)()
        _storage_path = path
    return _storage
