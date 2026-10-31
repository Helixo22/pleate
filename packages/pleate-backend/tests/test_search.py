import pytest

from pleate_backend.ai_chat.models import Conversation
from pleate_backend.files.models import File
from pleate_backend.notifications.models import Notification

pytestmark = pytest.mark.django_db


@pytest.fixture
def data(user, make_user):
    other = make_user()
    for owner, tag in ((user, "mine"), (other, "theirs")):
        File.objects.create(
            owner=owner, name=f"Report {tag}.pdf", key=f"k-{tag}", size=1, content_type="application/pdf"
        )
        Conversation.objects.create(user=owner, title=f"Report ideas {tag}")
        Notification.objects.create(user=owner, kind="x", title=f"Report ready {tag}", url="/reports/1")
    File.objects.create(
        owner=user,
        name="Report pending.pdf",
        key="k-p",
        size=1,
        content_type="application/pdf",
        status="pending",
    )
    return other


def test_search_returns_only_my_data(auth_api, data):
    res = auth_api.get("/api/search", {"q": "report"})
    assert res.status_code == 200
    results = res.json()
    assert {r["type"] for r in results} == {"files", "conversations", "notifications"}
    assert all("mine" in r["title"] for r in results), results
    assert len(results) == 3


def test_search_other_user_sees_only_theirs(api, data):
    api.force_authenticate(data)
    results = api.get("/api/search", {"q": "REPORT"}).json()
    assert len(results) == 3
    assert all("theirs" in r["title"] for r in results)


def test_search_result_shape(auth_api, user, data):
    file = File.objects.get(owner=user, name="Report mine.pdf")
    results = auth_api.get("/api/search", {"q": "report m", "types": "files"}).json()
    assert results == [
        {
            "type": "files",
            "id": str(file.pk),
            "title": "Report mine.pdf",
            "subtitle": "application/pdf",
            "url": f"/files/{file.pk}",
        }
    ]


def test_search_types_and_limit(auth_api, user, data):
    for i in range(12):
        Conversation.objects.create(user=user, title=f"Report {i}")
    res = auth_api.get("/api/search", {"q": "report", "types": "conversations", "limit": 50})
    assert res.status_code == 400
    res = auth_api.get("/api/search", {"q": "report", "types": "conversations", "limit": 10})
    results = res.json()
    assert len(results) == 10
    assert {r["type"] for r in results} == {"conversations"}


def test_search_input_is_not_a_regex(auth_api, user, data):
    Conversation.objects.create(user=user, title="a.b (c)")
    assert auth_api.get("/api/search", {"q": ".*"}).json() == []
    titles = [r["title"] for r in auth_api.get("/api/search", {"q": "(c)"}).json()]
    assert titles == ["a.b (c)"]


@pytest.mark.parametrize("params", [{"q": "a"}, {"q": "x" * 101}, {}, {"q": "ok", "types": "users"}])
def test_search_validation(auth_api, params):
    assert auth_api.get("/api/search", params).status_code == 400


def test_search_needs_a_user(api):
    assert api.get("/api/search", {"q": "report"}).status_code in (401, 403)


def test_search_drops_unsafe_notification_links(auth_api, user):
    for url in ("javascript:alert(1)", "//evil.com", "https://example.com/x"):
        Notification.objects.create(user=user, kind="x", title=f"Link {url}", url=url)
    urls = sorted(r["url"] for r in auth_api.get("/api/search", {"q": "link"}).json())
    assert urls == ["/notifications", "/notifications", "https://example.com/x"]
