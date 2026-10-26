"""
Files: private uploads with type sniffing, image cleaning, quotas and downloads.

Endpoints (mounted under ``/api/files/``), all for signed in users, every user
only sees their own files:

- ``GET    /files``                list, ``PagePagination``. ``search`` (name), filters
  ``content_type`` and ``purpose``, ``ordering`` by ``created_at``, ``size``, ``name``.
- ``POST   /files``                multipart, field ``file`` (one file per request, upload
  several in parallel) and optional ``purpose``. Throttle scope ``upload``. 201 with the file.
- ``GET    /files/usage``          ``{"used", "quota", "count"}`` in bytes.
- ``GET    /files/<id>``           one file.
- ``PATCH  /files/<id>``           ``{"name"}`` renames.
- ``DELETE /files/<id>``           deletes the record and the blob.
- ``GET    /files/<id>/download``  the bytes. ``Content-Disposition: attachment`` with an RFC 5987
  ``filename*``; ``?inline=1`` is honored for images and PDF only. ``nosniff``, ``private`` cache.
- ``POST   /files/presign``        ``{"name", "size", "content_type", "purpose"?}`` returns
  ``{"file_id", "upload_url", "fields", "expires_in"}`` for a direct browser upload to S3
  (presigned POST: send ``fields`` plus ``file`` as multipart to ``upload_url``).
- ``POST   /files/<id>/complete``  after the direct upload: checks size, sniffs the bytes,
  cleans images and marks the file ``ready``.

A file is ``ready`` or ``pending`` (direct upload not completed yet). Pending files are
hidden from lists and removed after a day by the ``core.tasks.cleanup`` task.

Checks on every upload, with stable error codes:

- ``file_too_large`` (413, ``max_size``), ``file_type_not_allowed`` (415),
  ``quota_exceeded`` (413, ``quota``, ``used``), ``invalid_image`` (400),
  ``presign_not_supported`` (400), ``upload_not_found`` (400).
- The type is detected from the bytes with ``filetype``; the client type and the
  extension are ignored, except that UTF-8 text with a ``.txt``/``.md``/``.log`` or
  ``.csv`` extension becomes ``text/plain`` or ``text/csv``.
- Images are decoded and re-encoded with Pillow: metadata (EXIF, GPS) is dropped, the EXIF
  orientation applied, and they are downscaled to ``IMAGE_MAX_DIMENSION``.
- Names are sanitized (no paths, control or reserved characters). Storage keys are random.

Settings, ``PLEATE["FILES"]``:

- ``STORAGE``: dotted path of a Django storage. Default ``GridFSStorage`` (MongoDB GridFS).
  Use ``storages.backends.s3.S3Storage`` for S3 or compatible services.
- ``MAX_SIZE`` (bytes, 25 MB), ``ALLOWED_TYPES`` (list of content types),
  ``USER_QUOTA`` (bytes, 500 MB, ``None`` for unlimited), ``IMAGE_MAX_DIMENSION`` (2400).
- ``PRESIGNED_UPLOADS``: enables ``presign``/``complete``; needs the S3 storage.

Python helpers for other apps:

    from pleate_backend.files.services import save_upload, open_file
    file = save_upload(user, uploaded_file, purpose="chat")   # runs every check
    with open_file(file) as handle: ...

``pleate_backend.files.models.File`` has ``owner``, ``name``, ``key``, ``size``,
``content_type``, ``checksum`` (sha256 hex), ``width``, ``height``, ``purpose``, ``status``
and ``created_at``. Deleting a File (or its owner) deletes the blob. File metadata is
part of the account data export.
"""
