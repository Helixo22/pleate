import os

from pleate_backend.settings import *  # noqa: F403
from pleate_backend.settings import database

SECRET_KEY = "test-secret-key-not-for-production-0123456789"
DEBUG = False
ALLOWED_HOSTS = ["*"]
ROOT_URLCONF = "tests.urls"

DATABASES = database(
    os.environ.get("PLEATE_TEST_MONGO_URI", "mongodb://localhost:27027/?directConnection=true"),
    name=os.environ.get("PLEATE_TEST_DB", "pleate"),
)

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
MAILERS = {"default": {"BACKEND": "django.core.mail.backends.locmem.EmailBackend"}}
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
LOGGING = {"version": 1, "disable_existing_loggers": False}

PLEATE = {
    "SITE_NAME": "Plate",
    "FRONTEND_URL": "http://app.test",
    "EMAILS": {"ASYNC": False},
}
