import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from pleate_backend.rbac import services as rbac
from pleate_backend.rbac.models import Feature, ObjectPermission, RoleInfo
from pleate_backend.rbac.permissions import HasFeature, HasObjectPerm, HasPerm, HasRole, ModelPerm

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()


def _perm(name):
    app_label, codename = name.split(".")
    return Permission.objects.get(content_type__app_label=app_label, codename=codename)


def _role(name, perms=(), default=False):
    group = Group.objects.create(name=name)
    RoleInfo.objects.create(group=group, is_default=default)
    group.permissions.set([_perm(p) for p in perms])
    return group


def _fresh(user):
    return User.objects.get(pk=user.pk)


# Object permissions


def test_grant_and_revoke_direct(make_user):
    alice, bob, doc = make_user(), make_user(), make_user()
    rbac.grant(alice, "pleate_accounts.change_user", doc)
    rbac.grant(alice, "pleate_accounts.change_user", doc)  # idempotent
    assert ObjectPermission.objects.count() == 1
    assert _fresh(alice).has_perm("pleate_accounts.change_user", doc)
    assert not _fresh(alice).has_perm("pleate_accounts.change_user")  # not global
    assert not _fresh(alice).has_perm("pleate_accounts.change_user", bob)  # other object
    assert not _fresh(bob).has_perm("pleate_accounts.change_user", doc)
    assert _fresh(alice).get_all_permissions(doc) == {"pleate_accounts.change_user"}
    assert rbac.revoke(alice, "pleate_accounts.change_user", doc) == 1
    assert not _fresh(alice).has_perm("pleate_accounts.change_user", doc)


def test_object_permissions_through_groups(make_user):
    member, outsider, doc = make_user(), make_user(), make_user()
    editors = _role("editors")
    member.groups.add(editors)
    rbac.grant(editors, "pleate_accounts.view_user", doc)
    assert _fresh(member).has_perm("pleate_accounts.view_user", doc)
    assert not _fresh(outsider).has_perm("pleate_accounts.view_user", doc)
    assert set(rbac.users_with_perm("pleate_accounts.view_user", doc)) == {member}
    rbac.grant(outsider, "pleate_accounts.view_user", doc)
    assert set(rbac.users_with_perm("pleate_accounts.view_user", doc)) == {member, outsider}
    rbac.revoke(editors, "pleate_accounts.view_user", doc)
    assert not _fresh(member).has_perm("pleate_accounts.view_user", doc)


def test_object_permissions_ignore_inactive_users(make_user):
    user, doc = make_user(), make_user()
    rbac.grant(user, "pleate_accounts.view_user", doc)
    user.is_active = False
    user.save()
    assert not _fresh(user).has_perm("pleate_accounts.view_user", doc)
    assert list(rbac.users_with_perm("pleate_accounts.view_user", doc)) == []


def test_grant_rejects_malformed_perm(make_user):
    with pytest.raises(ValueError):
        rbac.grant(make_user(), "change_user", make_user())


def test_clear_object_permissions(make_user):
    user, doc = make_user(), make_user()
    rbac.grant(user, "pleate_accounts.view_user", doc)
    rbac.grant(_role("r"), "pleate_accounts.view_user", doc)
    assert rbac.clear_object_permissions(doc) == 2


def test_deleting_group_removes_its_grants(make_user):
    doc = make_user()
    group = _role("temp")
    rbac.grant(group, "pleate_accounts.view_user", doc)
    group.delete()
    assert ObjectPermission.objects.count() == 0
    assert RoleInfo.objects.count() == 0


# Roles helpers


def test_role_helpers(user):
    _role("editor", ["pleate_accounts.view_user"])
    assert not rbac.has_role(user, "editor")
    rbac.assign_role(user, "editor")
    assert rbac.has_role(user, "editor")
    assert _fresh(user).has_perm("pleate_accounts.view_user")
    with pytest.raises(Group.DoesNotExist):
        rbac.assign_role(user, "ghost")
    rbac.remove_role(user, "editor")
    assert not rbac.has_role(user, "editor")


def test_default_roles_on_signup(api):
    _role("member", default=True)
    _role("admin")
    res = api.post("/api/auth/signup", {"email": "new@example.com", "password": PASSWORD})
    assert res.status_code == 201
    assert res.json()["user"]["extra"]["roles"] == ["member"]


def test_me_fields(auth_api, user):
    _role("editor", ["pleate_accounts.view_user", "auth.view_group"])
    rbac.assign_role(user, "editor")
    Feature.objects.create(key="beta", enabled=True)
    Feature.objects.create(key="hidden")
    extra = auth_api.get("/api/auth/me").json()["extra"]
    assert extra["roles"] == ["editor"]
    assert extra["permissions"] == ["auth.view_group", "pleate_accounts.view_user"]
    assert extra["features"] == ["beta"]


# Feature flags


def test_feature_enabled_rules(make_user):
    listed, in_group, other = make_user(), make_user(), make_user()
    group = _role("beta-testers")
    in_group.groups.add(group)
    flag = Feature.objects.create(key="new-ui")
    flag.users.add(listed)
    flag.groups.add(group)
    assert rbac.feature_enabled(listed, "new-ui")
    assert rbac.feature_enabled(in_group, "new-ui")
    assert not rbac.feature_enabled(other, "new-ui")
    assert not rbac.feature_enabled(other, "unknown")
    flag.enabled = True
    flag.save()
    assert rbac.feature_enabled(other, "new-ui")
    from django.contrib.auth.models import AnonymousUser

    assert rbac.feature_enabled(AnonymousUser(), "new-ui")
    assert rbac.enabled_features(AnonymousUser()) == ["new-ui"]


def test_rollout_is_stable_and_proportional(make_user):
    users = [make_user() for _ in range(40)]
    Feature.objects.create(key="half", rollout_percent=50)
    first = [rbac.feature_enabled(u, "half") for u in users]
    second = [rbac.feature_enabled(_fresh(u), "half") for u in users]
    assert first == second
    assert 5 < sum(first) < 35
    # Raising the percentage only adds users.
    Feature.objects.filter(key="half").update(rollout_percent=80)
    wider = [rbac.feature_enabled(u, "half") for u in users]
    assert all(w for f, w in zip(first, wider, strict=True) if f)
    Feature.objects.filter(key="half").update(rollout_percent=100)
    assert all(rbac.feature_enabled(u, "half") for u in users)
    Feature.objects.filter(key="half").update(rollout_percent=0)
    assert not any(rbac.feature_enabled(u, "half") for u in users)


def test_rollout_bucket_is_deterministic():
    assert rbac.rollout_bucket("x", "abc") == rbac.rollout_bucket("x", "abc")
    assert 0 <= rbac.rollout_bucket("x", "abc") < 100


def test_my_features_endpoint(auth_api, user):
    Feature.objects.create(key="a", enabled=True)
    Feature.objects.create(key="b").users.add(user)
    Feature.objects.create(key="c")
    res = auth_api.get("/api/rbac/features/me")
    assert res.status_code == 200
    assert res.json() == {"features": ["a", "b"]}


def test_my_features_needs_login(api):
    assert api.get("/api/rbac/features/me").status_code == 401


# Permission classes


def _view(*classes):
    class V(APIView):
        permission_classes = classes

        def get(self, request):
            return Response({"ok": True})

        def post(self, request):
            return Response({"ok": True})

    return V.as_view()


def _call(view, user=None, method="get"):
    req = getattr(APIRequestFactory(), method)("/x")
    if user is not None:
        force_authenticate(req, user)
    return view(req).status_code


def test_has_perm_class(make_user):
    allowed, denied = make_user(), make_user()
    allowed.user_permissions.add(_perm("auth.change_group"))
    view = _view(HasPerm("auth.change_group"))
    assert _call(view, _fresh(allowed)) == 200
    assert _call(view, denied) == 403
    assert _call(view) == 401


def test_has_role_class(make_user, staff):
    member, other = make_user(), make_user()
    member.groups.add(_role("editor"))
    view = _view(HasRole("editor", "admin"))
    assert _call(view, member) == 200
    assert _call(view, other) == 403
    assert _call(view, staff) == 200  # superuser


def test_has_feature_class(make_user):
    user = make_user()
    view = _view(HasFeature("beta"))
    assert _call(view, user) == 403
    Feature.objects.create(key="beta", enabled=True)
    assert _call(view, user) == 200


def test_model_perm_class(make_user):
    user = make_user()
    user.user_permissions.add(_perm("auth.view_group"))
    view = _view(ModelPerm("auth.group"))
    assert _call(_view(ModelPerm("auth.group")), _fresh(user)) == 200
    assert _call(view, _fresh(user), "post") == 403


def test_has_object_perm_class(make_user):
    user, doc, other = make_user(), make_user(), make_user()
    rbac.grant(user, "pleate_accounts.view_user", doc)
    perm = HasObjectPerm("pleate_accounts.view_user")()
    req = APIRequestFactory().get("/x")
    req.user = _fresh(user)
    assert perm.has_permission(req, None)
    assert perm.has_object_permission(req, None, doc)
    assert not perm.has_object_permission(req, None, other)


# Roles endpoints


def test_roles_require_staff_or_perm(auth_api, user):
    assert auth_api.get("/api/rbac/roles").status_code == 403
    user.user_permissions.add(_perm("auth.change_group"))
    auth_api.force_authenticate(_fresh(user))
    assert auth_api.get("/api/rbac/roles").status_code == 200


def test_roles_crud(api, staff):
    api.force_authenticate(staff)
    res = api.post(
        "/api/rbac/roles",
        {"name": "editor", "description": "Edits", "is_default": True, "permissions": ["auth.view_group"]},
        format="json",
    )
    assert res.status_code == 201, res.content
    role = res.json()
    assert role["permissions"] == ["auth.view_group"]
    assert role["is_default"] is True

    dup = api.post("/api/rbac/roles", {"name": "editor"}, format="json")
    assert dup.json()["error"]["fields"]["name"][0]["code"] == "role_taken"
    bad = api.post("/api/rbac/roles", {"name": "x", "permissions": ["nope.nothing"]}, format="json")
    assert bad.json()["error"]["fields"]["permissions"][0]["code"] == "unknown_permission"

    api.post("/api/rbac/roles", {"name": "viewer"}, format="json")
    listing = api.get("/api/rbac/roles?search=edit").json()
    assert listing["count"] == 1 and listing["results"][0]["name"] == "editor"
    assert [r["name"] for r in api.get("/api/rbac/roles?ordering=-name").json()["results"]] == [
        "viewer",
        "editor",
    ]

    rid = role["id"]
    res = api.patch(
        f"/api/rbac/roles/{rid}",
        {"name": "writer", "is_default": False, "permissions": ["auth.view_group", "auth.change_group"]},
        format="json",
    )
    assert res.status_code == 200
    assert res.json()["name"] == "writer"
    assert res.json()["description"] == "Edits"
    assert res.json()["permissions"] == ["auth.change_group", "auth.view_group"]
    assert api.get(f"/api/rbac/roles/{rid}").json()["is_default"] is False

    assert api.put(f"/api/rbac/roles/{rid}", {"name": "z"}, format="json").status_code == 405
    assert api.delete(f"/api/rbac/roles/{rid}").status_code == 204
    assert api.get(f"/api/rbac/roles/{rid}").status_code == 404
    assert api.get("/api/rbac/roles/not-an-id").status_code == 404


def test_role_without_info_is_listed(api, staff):
    Group.objects.create(name="legacy")
    api.force_authenticate(staff)
    role = api.get("/api/rbac/roles").json()["results"][0]
    assert role == {
        "id": role["id"],
        "name": "legacy",
        "description": "",
        "is_default": False,
        "permissions": [],
    }


def test_permissions_list(api, staff):
    api.force_authenticate(staff)
    res = api.get("/api/rbac/permissions?search=change_group")
    assert res.status_code == 200
    body = res.json()
    assert "auth.change_group" in [p["codename"] for p in body["results"]]
    assert {"count", "page", "page_count"} <= set(body)
    page = api.get("/api/rbac/permissions?page_size=5").json()
    assert len(page["results"]) == 5 and page["count"] > 5


def test_user_roles_endpoint(api, staff, user):
    _role("editor")
    api.force_authenticate(staff)
    url = f"/api/rbac/users/{user.pk}/roles"
    res = api.post(url, {"role": "editor"}, format="json")
    assert res.status_code == 200
    assert res.json() == {"roles": ["editor"]}
    assert rbac.has_role(user, "editor")
    unknown = api.post(url, {"role": "ghost"}, format="json")
    assert unknown.json()["error"]["fields"]["role"][0]["code"] == "unknown_role"
    res = api.delete(url, {"role": "editor"}, format="json")
    assert res.json() == {"roles": []}
    api.post(url, {"role": "editor"}, format="json")
    assert api.delete(f"{url}?role=editor").json() == {"roles": []}
    assert (
        api.post(
            "/api/rbac/users/000000000000000000000000/roles", {"role": "editor"}, format="json"
        ).status_code
        == 404
    )


def test_user_roles_denied_for_regular_users(auth_api, make_user):
    _role("admin")
    res = auth_api.post(f"/api/rbac/users/{make_user().pk}/roles", {"role": "admin"}, format="json")
    assert res.status_code == 403


# Features endpoints


def test_features_crud(api, staff, user):
    _role("beta")
    api.force_authenticate(staff)
    res = api.post(
        "/api/rbac/features",
        {
            "key": "new-ui",
            "description": "New UI",
            "rollout_percent": 20,
            "users": [str(user.pk)],
            "groups": ["beta"],
        },
        format="json",
    )
    assert res.status_code == 201, res.content
    flag = res.json()
    assert flag["users"] == [str(user.pk)] and flag["groups"] == ["beta"]
    assert (
        api.post("/api/rbac/features", {"key": "new-ui"}, format="json").json()["error"]["fields"]["key"][0][
            "code"
        ]
        == "feature_taken"
    )
    bad = api.post("/api/rbac/features", {"key": "x", "rollout_percent": 101}, format="json")
    assert bad.status_code == 400
    bad = api.post("/api/rbac/features", {"key": "y", "users": ["nope"]}, format="json")
    assert bad.json()["error"]["fields"]["users"][0]["code"] == "unknown_user"
    bad = api.post("/api/rbac/features", {"key": "y", "groups": ["nope"]}, format="json")
    assert bad.json()["error"]["fields"]["groups"][0]["code"] == "unknown_role"

    assert api.get("/api/rbac/features?search=new").json()["count"] == 1
    res = api.patch(f"/api/rbac/features/{flag['id']}", {"enabled": True, "users": []}, format="json")
    assert res.json()["enabled"] is True and res.json()["users"] == []
    assert res.json()["groups"] == ["beta"]
    assert api.get("/api/rbac/features?enabled=true").json()["count"] == 1
    assert api.delete(f"/api/rbac/features/{flag['id']}").status_code == 204
    assert Feature.objects.count() == 0


def test_features_crud_denied(auth_api):
    assert auth_api.get("/api/rbac/features").status_code == 403
    assert auth_api.post("/api/rbac/features", {"key": "x"}, format="json").status_code == 403


def test_features_with_model_perm(auth_api, user):
    user.user_permissions.add(_perm("pleate_rbac.view_feature"))
    auth_api.force_authenticate(_fresh(user))
    assert auth_api.get("/api/rbac/features").status_code == 200
    assert auth_api.post("/api/rbac/features", {"key": "x"}, format="json").status_code == 403
