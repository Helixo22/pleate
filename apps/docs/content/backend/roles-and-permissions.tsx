import { C, Callout, Code, Endpoints, Errors, H2, H3, P, Table } from "@/components/backend/prose";

export default function RolesAndPermissions() {
  return (
    <>
      <P>
        <C>pleate_backend.rbac</C> builds on Django auth instead of replacing it. A role is a Django <C>Group</C> with a{" "}
        <C>RoleInfo</C> row (description, <C>is_default</C>); global permissions keep working through <C>ModelBackend</C>;{" "}
        <C>ObjectPermissionBackend</C> adds permissions on single objects, held by a user directly or through a role.
        Feature flags live in the same app because they answer the same question: may this user see this?
      </P>

      <H2>In Python</H2>
      <Code lang="python">{`
from pleate_backend.rbac.services import (
    assign_role, remove_role, set_roles, has_role,
    grant, revoke, users_with_perm, clear_object_permissions,
    feature_enabled, enabled_features,
)

assign_role(user, "editor")
set_roles(user, ["editor", "viewer"])
has_role(user, "editor")                           # True

grant(user, "catalog.change_product", product)     # this product only
grant(editors_group, "catalog.view_product", product)
user.has_perm("catalog.change_product", product)   # object level, through the backend
users_with_perm("catalog.change_product", product)
clear_object_permissions(product)                  # before deleting it

feature_enabled(user, "new-editor")
`}</Code>
      <P>
        Roles flagged <C>is_default</C> are given to every new account (on <C>user_signed_up</C>), which is the usual way
        to grant a baseline such as <C>catalog.view_product</C>.
      </P>

      <H2>Permission classes</H2>
      <P>
        <C>pleate_backend.rbac.permissions</C> provides DRF permission factories. Each call returns a class, so they compose
        with <C>|</C> and <C>&amp;</C> like DRF&apos;s own.
      </P>
      <Table
        head={["Class", "Passes when"]}
        mono={[0]}
        rows={[
          ['HasPerm("app.codename", ...)', "The user has every listed global permission."],
          ['HasRole("editor", ...)', "The user has any listed role. Superusers pass."],
          ['HasObjectPerm("app.codename")', "The user has the permission on the object, or globally."],
          ['HasFeature("new-ui")', "The flag is on for the user."],
          ['ModelPerm("app.model")', "view, add, change or delete on the model, chosen from the HTTP method."],
        ]}
      />
      <Code lang="python" title="catalog/views.py">{`
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from pleate_backend.rbac.permissions import HasFeature, HasObjectPerm, HasRole, ModelPerm

class ProductViewSet(viewsets.ModelViewSet):
    # Read for everyone with view_product, write with add/change/delete_product
    permission_classes = [IsAuthenticated, ModelPerm("catalog.product")]

class PriceViewSet(viewsets.ModelViewSet):
    # Managers, or anyone granted change_price on that specific price list
    permission_classes = [IsAuthenticated, HasRole("manager") | HasObjectPerm("catalog.change_price")]

class InsightsView(APIView):
    permission_classes = [IsAuthenticated, HasFeature("insights")]
`}</Code>

      <H2>On the frontend</H2>
      <P>
        <C>/auth/me</C> carries <C>extra.roles</C>, <C>extra.permissions</C> (sorted global <C>app.codename</C> strings)
        and <C>extra.features</C>, so the UI can hide what the API would refuse:
      </P>
      <Code lang="tsx">{`
const { hasPermission, hasRole, hasFeature } = useMe();

{hasPermission("catalog.change_product") && <Button>Edit</Button>}
{hasFeature("new-editor") ? <NewEditor /> : <Editor />}
`}</Code>
      <Callout>Hiding a button is a convenience. The permission class on the view is the check that counts.</Callout>

      <H2>Feature flags</H2>
      <P>A flag is on for a user when any of these holds:</P>
      <Table
        head={["Field", "Effect"]}
        mono={[0]}
        rows={[
          ["enabled", "On for everyone."],
          ["users", "On for the listed users."],
          ["groups", "On for users with one of the listed roles."],
          ["rollout_percent", "On for that share of users, 0 to 100."],
        ]}
      />
      <P>
        The rollout bucket is <C>{'sha256("<key>:<user id>") % 100'}</C>: stable for a user, independent between flags,
        and raising the percentage only adds users, never swaps them.
      </P>

      <H2>Endpoints</H2>
      <P>
        Mounted at <C>/api/rbac</C>. Role and permission endpoints need <C>is_staff</C> or <C>auth.change_group</C>; flag
        management needs <C>is_staff</C> or the matching <C>pleate_rbac.*_feature</C> permission.
      </P>
      <Endpoints
        rows={[
          ["GET", "/rbac/roles", <>Page list, <C>?search=</C> name, <C>?ordering=name</C>.</>],
          ["POST", "/rbac/roles", <><C>{'{name, description?, is_default?, permissions?: ["app.codename"]}'}</C></>],
          ["GET", "/rbac/roles/<id>", <><C>{"{id, name, description, is_default, permissions}"}</C></>],
          ["PATCH", "/rbac/roles/<id>", <>Any field; <C>permissions</C> replaces the set.</>],
          ["DELETE", "/rbac/roles/<id>", "204. Also removes the role's object grants."],
          ["GET", "/rbac/permissions", <>Every permission, page list, <C>?search=</C> over codename, name, app and model.</>],
          ["POST", "/rbac/users/<user_id>/roles", <><C>{"{role}"}</C> → <C>{"{roles: [names]}"}</C></>],
          ["DELETE", "/rbac/users/<user_id>/roles", <><C>{"{role}"}</C> in the body or <C>?role=</C> → <C>{"{roles}"}</C></>],
          ["GET", "/rbac/features/me", <><C>{"{features: [keys]}"}</C> enabled for the signed in user. Any user.</>],
          ["GET", "/rbac/features", <>Page list, <C>?search=</C>, <C>?enabled=</C>, <C>?ordering=key,created_at,updated_at,rollout_percent</C>.</>],
          ["POST", "/rbac/features", <><C>{"{key, description?, enabled?, rollout_percent?, users?: [ids], groups?: [role names]}"}</C></>],
          ["GET|PATCH|DELETE", "/rbac/features/<id>", "Read, change or delete one flag."],
        ]}
      />

      <H3>Error codes</H3>
      <P>
        Most are validation codes: the response is a <C>validation_error</C> and the code sits on the field in{" "}
        <C>fields</C>.
      </P>
      <Errors
        rows={[
          ["role_taken", "400 field", "A role with this name exists."],
          ["unknown_permission", "400 field", <>A permission string is not a valid <C>app.codename</C>.</>],
          ["unknown_role", "400 field", "No role with this name."],
          ["unknown_user", "400 field", "No user with this id."],
          ["feature_taken", "400 field", "A flag with this key exists."],
          ["feature_disabled", "403", <>Raised by <C>HasFeature</C> when the flag is off.</>],
        ]}
      />
      <P>
        The admin registers Group (with its RoleInfo inline), RoleInfo, ObjectPermission and Feature. There are no
        settings.
      </P>
    </>
  );
}
