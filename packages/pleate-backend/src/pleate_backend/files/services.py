"""
Upload pipeline shared by the files endpoints and other apps (chat attachments...).

    from pleate_backend.files.services import save_upload, open_file
    file = save_upload(request.user, request.FILES["file"], purpose="chat")
    with open_file(file) as handle:
        data = handle.read()

Every check raises ``ApiError`` with a stable code: ``file_too_large`` (413),
``file_type_not_allowed`` (415), ``quota_exceeded`` (413), ``invalid_image`` (400).
"""

import codecs
import hashlib
import io
import logging
import mimetypes
import os
import re
import unicodedata
import uuid
from datetime import timedelta

import filetype
from django.core.files.base import ContentFile
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext as _

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.exceptions import ApiError

from .models import File
from .storage import get_storage

logger = logging.getLogger("pleate.files")

SNIFF_BYTES = 8192
TEXT_SNIFF_BYTES = 64 * 1024
PENDING_MAX_AGE = timedelta(days=1)
PRESIGN_EXPIRES = 15 * 60
MAX_FRAMES = 1000

TEXT_EXTENSIONS = {
    ".txt": "text/plain",
    ".text": "text/plain",
    ".log": "text/plain",
    ".md": "text/plain",
    ".csv": "text/csv",
}
IMAGE_FORMATS = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP", "image/gif": "GIF"}
EXTENSIONS = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "application/zip": ".zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}
INLINE_TYPES = {"application/pdf", *IMAGE_FORMATS}

_UNSAFE = re.compile(r'[\x00-\x1f\x7f<>:"/\\|?*]')


# Names and types


def sanitize_name(name: str, max_length: int = 200) -> str:
    """A display name safe for headers and file systems. Keeps the extension when truncating."""
    name = unicodedata.normalize("NFC", str(name or ""))
    name = name.replace("\\", "/").rsplit("/", 1)[-1]
    name = "".join(ch for ch in name if unicodedata.category(ch)[0] != "C")
    name = _UNSAFE.sub("_", name)
    name = re.sub(r"\s+", " ", name).strip().lstrip(".").strip()
    if len(name) > max_length:
        root, ext = os.path.splitext(name)
        ext = ext[:16]
        name = root[: max_length - len(ext)].rstrip() + ext
    return name or "file"


def _looks_like_text(head: bytes, complete: bool) -> bool:
    if b"\x00" in head:
        return False
    decoder = codecs.getincrementaldecoder("utf-8")()
    try:
        decoder.decode(head, final=complete)
    except UnicodeDecodeError:
        return False
    return True


def detect_content_type(head: bytes, name: str, complete: bool) -> str | None:
    """
    The content type from the first bytes. Text has no signature, so text/plain
    and text/csv are accepted when the bytes are UTF-8 and the extension matches.
    ``complete`` tells whether ``head`` holds the whole file.
    """
    kind = filetype.guess(head[:SNIFF_BYTES]) if head else None
    if kind is not None:
        return kind.mime
    ext = os.path.splitext(name)[1].lower()
    if ext in TEXT_EXTENSIONS and head and _looks_like_text(head, complete):
        return TEXT_EXTENSIONS[ext]
    return None


def extension_for(content_type: str) -> str:
    return EXTENSIONS.get(content_type) or mimetypes.guess_extension(content_type) or ""


# Checks


def _conf() -> dict:
    return pleate_settings.FILES


def check_size(size: int) -> None:
    max_size = _conf()["MAX_SIZE"]
    if size > max_size:
        raise ApiError("file_too_large", _("The file is too large."), 413, {"max_size": max_size})


def check_type(content_type: str | None) -> str:
    if not content_type or content_type not in _conf()["ALLOWED_TYPES"]:
        raise ApiError("file_type_not_allowed", _("This type of file is not allowed."), 415)
    return content_type


def usage(user, exclude=None) -> int:
    qs = File.objects.filter(owner=user)
    if exclude is not None:
        qs = qs.exclude(pk=exclude.pk)
    return qs.aggregate(total=Sum("size"))["total"] or 0


def check_quota(user, size: int, exclude=None) -> None:
    quota = _conf()["USER_QUOTA"]
    if quota is None:
        return
    used = usage(user, exclude)
    if used + size > quota:
        raise ApiError(
            "quota_exceeded", _("You are out of storage space."), 413, {"quota": quota, "used": used}
        )


def process_image(data, content_type: str) -> tuple[bytes, int, int]:
    """
    Decodes and re-encodes an image: drops EXIF and other metadata, applies the
    EXIF orientation and downscales to ``IMAGE_MAX_DIMENSION``.
    """
    from PIL import Image, ImageOps, ImageSequence, UnidentifiedImageError

    fmt = IMAGE_FORMATS[content_type]
    max_dim = _conf()["IMAGE_MAX_DIMENSION"]
    stream = io.BytesIO(data) if isinstance(data, bytes) else data
    try:
        stream.seek(0)
        with Image.open(stream) as probe:
            probe.verify()
        stream.seek(0)
        image = Image.open(stream)
        if image.format != fmt:
            raise ValueError("format mismatch")
        icc = image.info.get("icc_profile")
        out = io.BytesIO()
        frames = getattr(image, "n_frames", 1)
        if frames > MAX_FRAMES:
            raise ValueError("too many frames")
        if frames > 1 and fmt in ("GIF", "WEBP", "PNG"):
            converted, durations = [], []
            for frame in ImageSequence.Iterator(image):
                durations.append(frame.info.get("duration", 100))
                copy = frame.convert("RGBA")
                copy.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                converted.append(copy)
            first = converted[0]
            first.save(
                out,
                fmt,
                save_all=True,
                append_images=converted[1:],
                duration=durations,
                loop=image.info.get("loop", 0),
                disposal=2,
            )
            width, height = first.size
        else:
            image = ImageOps.exif_transpose(image)
            if fmt == "JPEG" and image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            elif fmt == "WEBP" and image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if image.has_transparency_data else "RGB")
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            options: dict = {}
            if icc:
                options["icc_profile"] = icc
            if fmt == "JPEG":
                options.update(quality=88, optimize=True)
            elif fmt == "WEBP":
                options.update(quality=88)
            elif fmt == "PNG":
                options.update(optimize=True)
            image.save(out, fmt, **options)
            width, height = image.size
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombError) as exc:
        raise ApiError("invalid_image", _("This file is not a valid image."), 400) from exc
    return out.getvalue(), width, height


def _sha256(fileobj) -> str:
    digest = hashlib.sha256()
    fileobj.seek(0)
    for chunk in iter(lambda: fileobj.read(1024 * 1024), b""):
        digest.update(chunk)
    fileobj.seek(0)
    return digest.hexdigest()


def _new_key(user, content_type: str) -> str:
    return f"files/{user.pk}/{uuid.uuid4().hex}{extension_for(content_type)}"


# Public API


def save_upload(user, uploaded_file, purpose: str = "") -> File:
    """Validates, cleans and stores one upload. Raises ``ApiError`` on every failed check."""
    size = uploaded_file.size
    check_size(size)
    name = sanitize_name(getattr(uploaded_file, "name", "") or "")
    uploaded_file.seek(0)
    head = uploaded_file.read(TEXT_SNIFF_BYTES)
    uploaded_file.seek(0)
    content_type = check_type(detect_content_type(head, name, complete=len(head) >= size))

    width = height = None
    content = uploaded_file
    if content_type in IMAGE_FORMATS:
        data, width, height = process_image(uploaded_file.read(), content_type)
        content = ContentFile(data)
        size = len(data)
    check_quota(user, size)

    checksum = _sha256(content)
    storage = get_storage()
    key = storage.save(_new_key(user, content_type), content)
    try:
        return File.objects.create(
            owner=user,
            name=name,
            key=key,
            size=size,
            content_type=content_type,
            checksum=checksum,
            width=width,
            height=height,
            purpose=(purpose or "")[:32],
        )
    except Exception:
        storage.delete(key)
        raise


def open_file(file: File):
    """A readable binary file object for the stored bytes. Close it when done."""
    return get_storage().open(file.key, "rb")


def delete_blob(file: File) -> None:
    if not file.key:
        return
    try:
        get_storage().delete(file.key)
    except Exception:  # noqa: BLE001
        logger.warning("could not delete blob %s", file.key, exc_info=True)


def remove_stale_pending() -> int:
    """Deletes direct uploads that never completed."""
    count = 0
    for file in File.objects.pending().filter(created_at__lt=timezone.now() - PENDING_MAX_AGE):
        file.delete()
        count += 1
    return count


# Direct uploads to S3


def is_s3_storage(storage) -> bool:
    try:
        from storages.backends.s3 import S3Storage
    except ImportError:
        return False
    return isinstance(storage, S3Storage)


def _s3_client(storage):
    return storage.connection.meta.client


def _s3_key(storage, key: str) -> str:
    from storages.utils import clean_name

    return storage._normalize_name(clean_name(key))


def presign_upload(user, name: str, size: int, content_type: str, purpose: str = "") -> tuple[File, dict]:
    """Reserves a pending File and returns a presigned POST for the browser to upload to S3."""
    storage = get_storage()
    if not _conf()["PRESIGNED_UPLOADS"] or not is_s3_storage(storage):
        raise ApiError("presign_not_supported", _("Direct uploads are not available."), 400)
    check_size(size)
    check_type(content_type)
    check_quota(user, size)
    file = File.objects.create(
        owner=user,
        name=sanitize_name(name),
        key=_new_key(user, content_type),
        size=size,
        content_type=content_type,
        purpose=(purpose or "")[:32],
        status=File.Status.PENDING,
    )
    post = _s3_client(storage).generate_presigned_post(
        Bucket=storage.bucket_name,
        Key=_s3_key(storage, file.key),
        Fields={"Content-Type": content_type},
        Conditions=[{"Content-Type": content_type}, ["content-length-range", 1, size]],
        ExpiresIn=PRESIGN_EXPIRES,
    )
    return file, {
        "file_id": str(file.pk),
        "upload_url": post["url"],
        "fields": post["fields"],
        "expires_in": PRESIGN_EXPIRES,
    }


def complete_upload(file: File) -> File:
    """Checks what landed in S3 (size, sniffed type, quota), then marks the File ready."""
    if file.status == File.Status.READY:
        return file
    storage = get_storage()
    if not is_s3_storage(storage):
        raise ApiError("presign_not_supported", _("Direct uploads are not available."), 400)
    client = _s3_client(storage)
    bucket, key = storage.bucket_name, _s3_key(storage, file.key)
    try:
        length = int(client.head_object(Bucket=bucket, Key=key)["ContentLength"])
    except Exception as exc:  # noqa: BLE001  botocore ClientError, 404 when nothing was uploaded
        raise ApiError("upload_not_found", _("The upload did not reach the storage."), 400) from exc

    try:
        check_size(length)
        if length > file.size:
            raise ApiError(
                "file_too_large", _("The file is larger than announced."), 413, {"max_size": file.size}
            )
        body = client.get_object(Bucket=bucket, Key=key)["Body"]
        head = body.read(TEXT_SNIFF_BYTES)
        content_type = check_type(detect_content_type(head, file.name, complete=len(head) >= length))
        width = height = None
        if content_type in IMAGE_FORMATS:
            data, width, height = process_image(head + body.read(), content_type)
            client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
            checksum, length = hashlib.sha256(data).hexdigest(), len(data)
        else:
            digest = hashlib.sha256(head)
            for chunk in iter(lambda: body.read(1024 * 1024), b""):
                digest.update(chunk)
            checksum = digest.hexdigest()
        check_quota(file.owner, length, exclude=file)
    except ApiError:
        file.delete()
        raise

    file.content_type = content_type
    file.size = length
    file.checksum = checksum
    file.width, file.height = width, height
    file.status = File.Status.READY
    file.save(update_fields=["content_type", "size", "checksum", "width", "height", "status"])
    return file
