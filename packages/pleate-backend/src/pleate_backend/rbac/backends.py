class ObjectPermissionBackend:
    """
    Object level permissions stored in ``ObjectPermission`` rows, held by the
    user directly or through one of its groups (roles).

    Answers only when an object is given: global permissions stay with
    Django's ModelBackend (here ``accounts.backends.EmailBackend``).

        user.has_perm("projects.change_project", project)
    """

    def authenticate(self, request, **kwargs):
        return None

    def get_user(self, user_id):
        return None

    def get_all_permissions(self, user_obj, obj=None):
        if obj is None:
            return set()
        from .services import object_permissions

        return set(object_permissions(user_obj, obj))

    def has_perm(self, user_obj, perm, obj=None):
        if obj is None:
            return False
        return perm in self.get_all_permissions(user_obj, obj)

    def has_module_perms(self, user_obj, app_label):
        return False
