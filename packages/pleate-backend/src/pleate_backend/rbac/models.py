from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class RoleInfo(models.Model):
    """Extra data of a role. A role is a plain Django auth ``Group``."""

    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name="role_info")
    description = models.CharField(_("description"), max_length=500, blank=True)
    # Default roles are given to every new account on signup.
    is_default = models.BooleanField(_("default"), default=False, db_index=True)

    class Meta:
        verbose_name = _("role info")
        verbose_name_plural = _("role info")

    def __str__(self):
        return self.group.name


class ObjectPermission(models.Model):
    """``permission`` ("app_label.codename") on one object, for a user or a group."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="object_permissions",
    )
    group = models.ForeignKey(
        Group, null=True, blank=True, on_delete=models.CASCADE, related_name="object_permissions"
    )
    permission = models.CharField(_("permission"), max_length=255)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="+")
    object_id = models.CharField(_("object id"), max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("object permission")
        verbose_name_plural = _("object permissions")
        indexes = [models.Index(fields=["content_type", "object_id"], name="pl_rbac_objperm_target")]
        ordering = ["-created_at"]

    def __str__(self):
        holder = self.user or self.group
        return f"{holder}: {self.permission} on {self.content_type.model}:{self.object_id}"

    def clean(self):
        if (self.user_id is None) == (self.group_id is None):
            raise ValidationError(_("Set either a user or a group."))


class Feature(models.Model):
    """
    A feature flag. It is on for a user when it is ``enabled`` for everyone,
    the user is listed, one of the user's roles is listed, or the user falls in
    the ``rollout_percent`` bucket (stable per user and flag).
    """

    key = models.SlugField(_("key"), max_length=100, unique=True)
    description = models.CharField(_("description"), max_length=500, blank=True)
    enabled = models.BooleanField(_("enabled for everyone"), default=False)
    rollout_percent = models.PositiveSmallIntegerField(
        _("rollout percent"), default=0, validators=[MaxValueValidator(100)]
    )
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="+")
    groups = models.ManyToManyField(Group, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("feature flag")
        verbose_name_plural = _("feature flags")
        ordering = ["key"]

    def __str__(self):
        return self.key
