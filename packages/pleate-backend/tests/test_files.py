import hashlib
import io
from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient
from storages.backends.s3 import S3Storage

from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.tasks import cleanup
from pleate_backend.files import services
from pleate_backend.files.models import File
from pleate_backend.files.storage import get_storage

pytestmark = pytest.mark.django_db
User = get_user_model()

PDF = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


def pleate(**sections):
    return override_settings(PLEATE={**settings.PLEATE, **sections})


def files_conf(**overrides):
    from pleate_backend.core.conf import DEFAULTS

    return pleate(FILES={**DEFAULTS["FILES"], **overrides})


def _image(size=(64, 48), fmt="PNG", name="a.png", exif=None, color=(200, 30, 30)):
    buf = io.BytesIO()
    image = Image.new("RGB", size, color)
    options = {"exif": exif} if exif is not None else {}
    image.save(buf, fmt, **options)
    buf.seek(0)
    buf.name = name
    return buf


def _bytes(data: bytes, name: str):
    buf = io.BytesIO(data)
    buf.name = name
    return buf


def upload(client, fileobj, **extra):
    return client.post("/api/files/", {"file": fileobj, **extra}, format="multipart")


# Upload and type detection


def test_upload_png(auth_api, user):
    res = upload(auth_api, _image(), purpose="chat")
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["name"] == "a.png"
    assert body["content_type"] == "image/png"
    assert (body["width"], body["height"]) == (64, 48)
    assert body["purpose"] == "chat"
    assert body["status"] == "ready"
    assert body["download_url"] == f"/api/files/{body['id']}/download"
    file = File.objects.get(pk=body["id"])
    assert file.owner_id == user.pk
    assert get_storage().exists(file.key)
    with services.open_file(file) as handle:
        data = handle.read()
    assert hashlib.sha256(data).hexdigest() == body["checksum"] == file.checksum
    assert len(data) == body["size"]


def test_upload_requires_file(auth_api):
    res = auth_api.post("/api/files/", {}, format="multipart")
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["file"][0]["code"] == "required"


def test_upload_requires_auth(api):
    assert upload(api, _image()).status_code == 401


def test_type_is_sniffed_not_taken_from_extension(auth_api):
    res = upload(auth_api, _image(name="report.pdf"))
    assert res.status_code == 201
    assert res.json()["content_type"] == "image/png"
    assert res.json()["name"] == "report.pdf"


def test_client_content_type_is_ignored(auth_api):
    fake = SimpleUploadedFile("evil.png", b"MZ\x90\x00" + b"\x00" * 200, content_type="image/png")
    res = upload(auth_api, fake)
    assert res.status_code == 415
    assert res.json()["error"]["code"] == "file_type_not_allowed"


def test_pdf_upload(auth_api):
    res = upload(auth_api, _bytes(PDF, "doc.bin"))
    assert res.status_code == 201
    assert res.json()["content_type"] == "application/pdf"
    assert res.json()["width"] is None


def test_text_and_csv_fallback(auth_api):
    res = upload(auth_api, _bytes("ciao, così va bene\n".encode(), "notes.txt"))
    assert res.json()["content_type"] == "text/plain"
    res = upload(auth_api, _bytes(b"a,b\n1,2\n", "table.csv"))
    assert res.json()["content_type"] == "text/csv"


def test_text_needs_matching_extension_and_utf8(auth_api):
    assert upload(auth_api, _bytes(b"hello world", "script.sh")).status_code == 415
    assert upload(auth_api, _bytes(b"\xff\xfe\x00bad", "notes.txt")).status_code == 415


def test_type_not_in_allowed_list(auth_api):
    with files_conf(ALLOWED_TYPES=["application/pdf"]):
        res = upload(auth_api, _image())
    assert res.status_code == 415


def test_file_too_large(auth_api):
    with files_conf(MAX_SIZE=100):
        res = upload(auth_api, _bytes(b"x" * 200, "big.txt"))
    assert res.status_code == 413
    assert res.json()["error"]["code"] == "file_too_large"
    assert res.json()["error"]["max_size"] == 100


def test_quota_exceeded(auth_api, user):
    with files_conf(USER_QUOTA=1000):
        assert upload(auth_api, _bytes(b"a" * 600, "one.txt")).status_code == 201
        res = upload(auth_api, _bytes(b"b" * 600, "two.txt"))
    assert res.status_code == 413
    error = res.json()["error"]
    assert error["code"] == "quota_exceeded"
    assert (error["quota"], error["used"]) == (1000, 600)
    assert File.objects.filter(owner=user).count() == 1


def test_names_are_sanitized(auth_api):
    res = upload(auth_api, _bytes(b"hello", "../../etc/pass<wd>\x07.txt"))
    assert res.status_code == 201
    assert res.json()["name"] == "pass_wd_.txt"
    assert services.sanitize_name("..\\..\\.hidden") == "hidden"
    assert services.sanitize_name("") == "file"
    long = services.sanitize_name("a" * 400 + ".pdf")
    assert len(long) == 200 and long.endswith(".pdf")


def test_storage_key_does_not_use_client_name(auth_api, user):
    res = upload(auth_api, _bytes(b"hello", "my file.txt"))
    key = File.objects.get(pk=res.json()["id"]).key
    assert key.startswith(f"files/{user.pk}/") and key.endswith(".txt")
    assert "my file" not in key


# Images


def test_image_is_downscaled(auth_api):
    with files_conf(IMAGE_MAX_DIMENSION=100):
        res = upload(auth_api, _image(size=(300, 150)))
    body = res.json()
    assert (body["width"], body["height"]) == (100, 50)
    with services.open_file(File.objects.get(pk=body["id"])) as handle:
        assert Image.open(handle).size == (100, 50)


def test_exif_is_stripped_and_orientation_applied(auth_api):
    exif = Image.Exif()
    exif[0x010F] = "SecretCam"  # Make
    exif[0x0112] = 6  # Orientation: rotate 90
    res = upload(auth_api, _image(size=(40, 20), fmt="JPEG", name="p.jpg", exif=exif.tobytes()))
    body = res.json()
    assert body["content_type"] == "image/jpeg"
    assert (body["width"], body["height"]) == (20, 40)
    with services.open_file(File.objects.get(pk=body["id"])) as handle:
        data = handle.read()
    assert b"SecretCam" not in data
    assert not Image.open(io.BytesIO(data)).getexif()


def test_animated_gif_keeps_frames(auth_api):
    buf = io.BytesIO()
    frames = [Image.new("RGB", (300, 300), c) for c in ((255, 0, 0), (0, 255, 0), (0, 0, 255))]
    frames[0].save(buf, "GIF", save_all=True, append_images=frames[1:], duration=100, loop=0)
    buf.seek(0)
    buf.name = "anim.gif"
    with files_conf(IMAGE_MAX_DIMENSION=100):
        res = upload(auth_api, buf)
    body = res.json()
    assert (body["content_type"], body["width"]) == ("image/gif", 100)
    with services.open_file(File.objects.get(pk=body["id"])) as handle:
        assert Image.open(handle).n_frames == 3


def test_corrupt_image(auth_api):
    data = _image().getvalue()[:60]
    res = upload(auth_api, _bytes(data, "broken.png"))
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_image"


# save_upload contract


def test_save_upload_service(user):
    file = services.save_upload(user, SimpleUploadedFile("a.csv", b"x,y\n"), purpose="attachment")
    assert (file.content_type, file.purpose, file.size) == ("text/csv", "attachment", 4)
    assert file.checksum == hashlib.sha256(b"x,y\n").hexdigest()
    with pytest.raises(ApiError) as exc:
        services.save_upload(user, SimpleUploadedFile("a.exe", b"MZ" + b"\x00" * 100))
    assert exc.value.code == "file_type_not_allowed"
    assert exc.value.status_code == 415


# List, detail, rename, delete


def test_list_filters_search_and_ordering(auth_api):
    upload(auth_api, _bytes(b"aaaa", "alpha.txt"), purpose="chat")
    upload(auth_api, _bytes(b"bb", "beta.csv"))
    upload(auth_api, _image(name="gamma.png"), purpose="chat")
    res = auth_api.get("/api/files/")
    body = res.json()
    assert body["count"] == 3 and body["page_count"] == 1
    assert [f["name"] for f in body["results"]] == ["gamma.png", "beta.csv", "alpha.txt"]
    assert auth_api.get("/api/files/?purpose=chat").json()["count"] == 2
    assert auth_api.get("/api/files/?content_type=text/csv").json()["results"][0]["name"] == "beta.csv"
    assert auth_api.get("/api/files/?search=alph").json()["count"] == 1
    names = [f["name"] for f in auth_api.get("/api/files/?ordering=name").json()["results"]]
    assert names == ["alpha.txt", "beta.csv", "gamma.png"]
    sizes = [f["size"] for f in auth_api.get("/api/files/?ordering=size").json()["results"]]
    assert sizes == sorted(sizes)
    bad = auth_api.get("/api/files/?ordering=key")
    assert bad.json()["error"]["code"] == "invalid_ordering"
    page = auth_api.get("/api/files/?page_size=2&page=2").json()
    assert (page["page"], page["page_count"], len(page["results"])) == (2, 2, 1)


def test_detail_rename_delete(auth_api):
    file_id = upload(auth_api, _bytes(b"hello", "a.txt")).json()["id"]
    key = File.objects.get(pk=file_id).key
    assert auth_api.get(f"/api/files/{file_id}").json()["name"] == "a.txt"
    res = auth_api.patch(f"/api/files/{file_id}", {"name": "  ../Renamed.txt "}, format="json")
    assert res.json()["name"] == "Renamed.txt"
    assert auth_api.patch(f"/api/files/{file_id}", {"name": ""}, format="json").status_code == 400
    assert auth_api.delete(f"/api/files/{file_id}").status_code == 204
    assert not File.objects.filter(pk=file_id).exists()
    assert not get_storage().exists(key)
    assert auth_api.get(f"/api/files/{file_id}").status_code == 404


def test_unknown_or_malformed_id(auth_api):
    assert auth_api.get("/api/files/507f1f77bcf86cd799439011").status_code == 404
    assert auth_api.get("/api/files/not-an-id").status_code == 404


def test_ownership_isolation(auth_api, make_user):
    file_id = upload(auth_api, _bytes(b"secret", "mine.txt")).json()["id"]
    other = APIClient()
    other.force_authenticate(make_user())
    assert other.get("/api/files/").json()["count"] == 0
    assert other.get(f"/api/files/{file_id}").status_code == 404
    assert other.get(f"/api/files/{file_id}/download").status_code == 404
    assert other.patch(f"/api/files/{file_id}", {"name": "x"}, format="json").status_code == 404
    assert other.delete(f"/api/files/{file_id}").status_code == 404
    assert other.post(f"/api/files/{file_id}/complete").status_code == 404
    assert other.get("/api/files/usage").json() == {"used": 0, "quota": 500 * 1024 * 1024, "count": 0}
    assert File.objects.filter(pk=file_id).exists()


def test_usage(auth_api):
    upload(auth_api, _bytes(b"a" * 10, "a.txt"))
    upload(auth_api, _bytes(b"b" * 5, "b.txt"))
    with files_conf(USER_QUOTA=1000):
        assert auth_api.get("/api/files/usage").json() == {"used": 15, "quota": 1000, "count": 2}


# Download


def test_download_headers(auth_api):
    file_id = upload(auth_api, _bytes(PDF, "Résumé 2026.pdf")).json()["id"]
    res = auth_api.get(f"/api/files/{file_id}/download")
    assert res.status_code == 200
    assert b"".join(res.streaming_content) == PDF
    assert res["Content-Type"] == "application/pdf"
    assert res["Content-Disposition"] == (
        "attachment; filename=\"Resume 2026.pdf\"; filename*=UTF-8''R%C3%A9sum%C3%A9%202026.pdf"
    )
    assert res["X-Content-Type-Options"] == "nosniff"
    assert res["Cache-Control"].startswith("private")
    inline = auth_api.get(f"/api/files/{file_id}/download?inline=1")
    assert inline["Content-Disposition"].startswith("inline;")


def test_inline_only_for_images_and_pdf(auth_api):
    text_id = upload(auth_api, _bytes(b"<script>alert(1)</script>", "page.txt")).json()["id"]
    res = auth_api.get(f"/api/files/{text_id}/download?inline=1")
    assert res["Content-Disposition"].startswith("attachment;")
    assert res["Content-Type"] == "text/plain"
    image_id = upload(auth_api, _image()).json()["id"]
    res = auth_api.get(f"/api/files/{image_id}/download?inline=1")
    assert res["Content-Disposition"].startswith("inline;")
    assert res["Content-Type"] == "image/png"


def test_download_missing_blob(auth_api):
    file_id = upload(auth_api, _bytes(b"hello", "a.txt")).json()["id"]
    get_storage().delete(File.objects.get(pk=file_id).key)
    assert auth_api.get(f"/api/files/{file_id}/download").status_code == 404


# Throttle


def test_upload_is_throttled(auth_api):
    rates = {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "upload": "2/hour"}
    with override_settings(REST_FRAMEWORK={**settings.REST_FRAMEWORK, "DEFAULT_THROTTLE_RATES": rates}):
        assert upload(auth_api, _bytes(b"1", "1.txt")).status_code == 201
        assert upload(auth_api, _bytes(b"2", "2.txt")).status_code == 201
        assert upload(auth_api, _bytes(b"3", "3.txt")).status_code == 429
        # Reading is not limited by the upload scope.
        assert auth_api.get("/api/files/").status_code == 200


# Lifecycle


def test_user_deletion_removes_blobs(auth_api, user):
    file_id = upload(auth_api, _bytes(b"hello", "a.txt")).json()["id"]
    key = File.objects.get(pk=file_id).key
    user.delete()
    assert not File.objects.filter(pk=file_id).exists()
    assert not get_storage().exists(key)


def test_export_includes_files(auth_api):
    upload(auth_api, _bytes(b"hello", "a.txt"))
    data = auth_api.get("/api/auth/me/export").json()
    assert data["files"][0]["name"] == "a.txt"
    assert data["files"][0]["checksum"] == hashlib.sha256(b"hello").hexdigest()


def test_cleanup_removes_stale_pending(user):
    old = File.objects.create(
        owner=user, name="a", key="files/x/old", content_type="image/png", size=5, status="pending"
    )
    File.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=2))
    fresh = File.objects.create(
        owner=user, name="b", key="files/x/new", content_type="image/png", size=5, status="pending"
    )
    ready = File.objects.create(owner=user, name="c", key="files/x/ready", content_type="image/png", size=5)
    File.objects.filter(pk=ready.pk).update(created_at=timezone.now() - timedelta(days=2))
    cleanup()
    assert set(File.objects.values_list("name", flat=True)) == {"b", "c"}
    assert fresh.pk


# Direct uploads to S3


class FakeS3Storage(S3Storage):
    deleted: list = []

    def __init__(self, **kwargs):
        super().__init__(bucket_name="bucket", **kwargs)

    def delete(self, name):
        FakeS3Storage.deleted.append(name)


@pytest.fixture
def s3(monkeypatch):
    client = MagicMock()
    client.generate_presigned_post.side_effect = lambda **kw: {
        "url": "https://bucket.s3.amazonaws.com/",
        "fields": {"key": kw["Key"], "Content-Type": kw["Fields"]["Content-Type"], "policy": "p"},
    }
    monkeypatch.setattr(services, "_s3_client", lambda storage: client)
    FakeS3Storage.deleted = []
    with files_conf(STORAGE="tests.test_files.FakeS3Storage", PRESIGNED_UPLOADS=True):
        yield client


def _stored(client, data: bytes):
    client.head_object.return_value = {"ContentLength": len(data)}
    client.get_object.return_value = {"Body": io.BytesIO(data)}


def test_presign_not_supported_with_gridfs(auth_api):
    res = auth_api.post(
        "/api/files/presign", {"name": "a.pdf", "size": 10, "content_type": "application/pdf"}
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "presign_not_supported"


def test_presign_needs_setting(auth_api, s3):
    with files_conf(STORAGE="tests.test_files.FakeS3Storage", PRESIGNED_UPLOADS=False):
        res = auth_api.post(
            "/api/files/presign", {"name": "a.pdf", "size": 10, "content_type": "application/pdf"}
        )
    assert res.json()["error"]["code"] == "presign_not_supported"


def test_presign_and_complete(auth_api, s3, user):
    res = auth_api.post(
        "/api/files/presign",
        {"name": "doc.pdf", "size": len(PDF), "content_type": "application/pdf", "purpose": "chat"},
    )
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["upload_url"] == "https://bucket.s3.amazonaws.com/"
    assert body["expires_in"] == services.PRESIGN_EXPIRES
    kwargs = s3.generate_presigned_post.call_args.kwargs
    assert kwargs["Bucket"] == "bucket"
    assert ["content-length-range", 1, len(PDF)] in kwargs["Conditions"]
    assert body["fields"]["key"].startswith(f"files/{user.pk}/")

    # Pending files are hidden.
    assert auth_api.get("/api/files/").json()["count"] == 0
    assert auth_api.get(f"/api/files/{body['file_id']}").status_code == 404

    _stored(s3, PDF)
    res = auth_api.post(f"/api/files/{body['file_id']}/complete")
    assert res.status_code == 200, res.content
    done = res.json()
    assert (done["status"], done["content_type"], done["purpose"]) == ("ready", "application/pdf", "chat")
    assert done["checksum"] == hashlib.sha256(PDF).hexdigest()
    assert auth_api.get("/api/files/").json()["count"] == 1
    # Completing again is harmless.
    assert auth_api.post(f"/api/files/{body['file_id']}/complete").status_code == 200


def test_presign_validates(auth_api, s3):
    res = auth_api.post(
        "/api/files/presign", {"name": "a.exe", "size": 10, "content_type": "application/x-msdownload"}
    )
    assert res.json()["error"]["code"] == "file_type_not_allowed"
    res = auth_api.post(
        "/api/files/presign", {"name": "a.pdf", "size": 10**12, "content_type": "application/pdf"}
    )
    assert res.json()["error"]["code"] == "file_too_large"
    res = auth_api.post("/api/files/presign", {"name": "a.pdf", "size": 0, "content_type": "application/pdf"})
    assert res.status_code == 400


def test_complete_rejects_disguised_file(auth_api, s3):
    body = auth_api.post(
        "/api/files/presign", {"name": "a.pdf", "size": 300, "content_type": "application/pdf"}
    ).json()
    _stored(s3, b"MZ" + b"\x00" * 200)
    res = auth_api.post(f"/api/files/{body['file_id']}/complete")
    assert res.status_code == 415
    assert not File.objects.filter(pk=body["file_id"]).exists()
    assert FakeS3Storage.deleted == [body["fields"]["key"]]


def test_complete_rejects_larger_than_announced(auth_api, s3):
    body = auth_api.post(
        "/api/files/presign", {"name": "a.pdf", "size": 10, "content_type": "application/pdf"}
    ).json()
    _stored(s3, PDF)
    res = auth_api.post(f"/api/files/{body['file_id']}/complete")
    assert res.json()["error"]["code"] == "file_too_large"


def test_complete_missing_object(auth_api, s3):
    body = auth_api.post(
        "/api/files/presign", {"name": "a.pdf", "size": 10, "content_type": "application/pdf"}
    ).json()
    s3.head_object.side_effect = Exception("404")
    res = auth_api.post(f"/api/files/{body['file_id']}/complete")
    assert res.json()["error"]["code"] == "upload_not_found"


def test_complete_cleans_images(auth_api, s3):
    data = _image(size=(300, 100)).getvalue()
    body = auth_api.post(
        "/api/files/presign", {"name": "a.png", "size": len(data), "content_type": "image/png"}
    ).json()
    _stored(s3, data)
    with files_conf(
        STORAGE="tests.test_files.FakeS3Storage", PRESIGNED_UPLOADS=True, IMAGE_MAX_DIMENSION=150
    ):
        done = auth_api.post(f"/api/files/{body['file_id']}/complete").json()
    assert (done["width"], done["height"]) == (150, 50)
    put = s3.put_object.call_args.kwargs
    assert put["ContentType"] == "image/png"
    assert hashlib.sha256(put["Body"]).hexdigest() == done["checksum"]
