import re
import subprocess
from pathlib import Path

import pytest
from django.core import mail

from pleate_backend.emails import render_email

LOCALE_DIR = Path(__file__).resolve().parent.parent / "src" / "pleate_backend" / "locale"


@pytest.mark.django_db
def test_error_in_italian_from_accept_language(api, user):
    res = api.post(
        "/api/auth/login",
        {"email": user.email, "password": "nope-nope-nope"},
        HTTP_ACCEPT_LANGUAGE="it-IT,it;q=0.9",
    )
    assert res.status_code == 400
    assert res.json()["error"]["message"] == "Email o password sbagliate."
    assert res["Content-Language"] == "it"


@pytest.mark.django_db
def test_error_in_italian_from_locale_cookie(api, user):
    api.cookies["locale"] = "it"
    res = api.post(
        "/api/auth/login",
        {"email": user.email, "password": "nope-nope-nope"},
        HTTP_ACCEPT_LANGUAGE="es",
    )
    assert res.json()["error"]["message"] == "Email o password sbagliate."


@pytest.mark.django_db
def test_validation_message_in_spanish(api, user):
    res = api.post(
        "/api/auth/signup",
        {"email": user.email, "password": "correct-horse-battery-9"},
        HTTP_ACCEPT_LANGUAGE="es",
    )
    assert res.status_code == 400
    error = res.json()["error"]
    assert error["message"] == "Algunos campos no son válidos."
    assert error["fields"]["email"][0]["message"] == "Ya existe una cuenta con este correo."


def test_verify_email_subject_in_italian():
    subject, text, html = render_email(
        "verify_email", {"name": "Ada", "action_url": "https://example.com/v?token=x"}, "it"
    )
    assert subject.startswith("Conferma la tua email per ")
    assert "Ciao Ada," in text
    assert "Se non hai creato un account, ignora questa email." in html


@pytest.mark.django_db
def test_password_reset_email_in_spanish(api, user):
    res = api.post("/api/auth/password/reset", {"email": user.email}, HTTP_ACCEPT_LANGUAGE="es")
    assert res.status_code == 202
    message = mail.outbox[0]
    assert message.subject.startswith("Restablece tu contraseña de ")
    assert "Hola, Ada:" in message.body
    assert "alguien pidió restablecer la contraseña de tu cuenta" in message.body


@pytest.mark.parametrize("language", ["it", "es"])
def test_catalog_is_complete(language):
    po = LOCALE_DIR / language / "LC_MESSAGES" / "django.po"
    assert (po.with_suffix(".mo")).exists()
    result = subprocess.run(
        ["msgfmt", "--check", "--statistics", "-o", "/dev/null", str(po)],
        capture_output=True,
        text=True,
        check=True,
    )
    stats = result.stderr.strip()
    assert re.fullmatch(r"\d+ translated messages\.", stats), stats
    assert "#, fuzzy" not in po.read_text(encoding="utf-8")
