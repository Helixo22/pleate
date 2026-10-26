import { C, Callout, Code, H2, P, Settings, Table } from "@/components/backend/prose";

export default function Emails() {
  return (
    <>
      <P>
        <C>pleate_backend.emails</C> renders transactional emails from Django templates, in the recipient&apos;s language,
        and sends them through Celery. Every other app uses it: verification links, password resets, security notices,
        notifications, newsletter confirmations, contact messages, waitlist invites.
      </P>

      <H2>Sending</H2>
      <Code lang="python">{`
from pleate_backend.emails import send_email

send_email(
    "order_shipped",                         # template name
    to="ada@plate.dev",                      # or a list
    context={"name": "Ada", "action_url": "https://plate.app/orders/1042", "action_label": "Track order"},
    language="it",                           # default: LANGUAGE_CODE
    reply_to=["support@plate.app"],
)
`}</Code>
      <P>
        With <C>{`PLEATE["EMAILS"]["ASYNC"]`}</C> on (the default) the email is queued as the{" "}
        <C>pleate_backend.emails.send</C> task, retried up to five times with backoff on network errors. If the queue
        cannot be reached it is sent inline, so a broker outage never loses a password reset. Context values must be JSON
        serializable. <C>render_email(template, context, language)</C> returns <C>(subject, text, html)</C> for previews
        and tests.
      </P>

      <H2>Templates</H2>
      <P>
        A template is three files in <C>pleate/emails/</C>: the subject, the plain text body and, optionally, the HTML
        body. Every template gets <C>site_name</C> and <C>frontend_url</C>. HTML ones extend{" "}
        <C>pleate/emails/base.html</C>, fill <C>{"{% block content %}"}</C>, and get a button when the context has{" "}
        <C>action_url</C> and <C>action_label</C>; <C>{"{% block footer %}"}</C> replaces the line at the bottom.
      </P>
      <Code lang="text" title="templates/pleate/emails/">{`
order_shipped.subject.txt
order_shipped.txt
order_shipped.html
`}</Code>
      <Code lang="django" title="order_shipped.subject.txt">{`{% load i18n %}{% blocktranslate %}Your {{ site_name }} order is on its way{% endblocktranslate %}`}</Code>
      <Code lang="django" title="order_shipped.html">{`
{% extends "pleate/emails/base.html" %}
{% load i18n %}
{% block content %}
  <p>{% blocktranslate %}Hi {{ name }},{% endblocktranslate %}</p>
  <p>{% translate "Your order left our kitchen this morning." %}</p>
{% endblock %}
`}</Code>
      <H2>Built in templates</H2>
      <Table
        head={["Template", "Sent by", "Context"]}
        mono={[0]}
        rows={[
          ["verify_email", "Signup, resend", "name, action_url, action_label"],
          ["password_reset", "Forgot password, staff reset", "name, action_url, action_label, minutes"],
          ["email_change", "Email change (to the new address)", "name, new_email, action_url, action_label"],
          ["security_notice", "Password, email, 2FA and OAuth changes", "name, message"],
          ["notification", "notify() on the email channel", "title, body, action_url, action_label"],
          ["newsletter_confirm", "Newsletter double opt in", "action_url, action_label"],
          ["contact_message", "Contact form, to the team", "name, email, subject, message"],
          ["waitlist_invite", "Staff invite from the waitlist", "action_url, action_label"],
        ]}
      />

      <H2>Overriding</H2>
      <P>
        Templates are looked up through Django&apos;s loaders, so a file with the same path in your project wins. Put your
        project templates first:
      </P>
      <Code lang="python" title="settings.py">{`
TEMPLATES[0]["DIRS"] = [BASE_DIR / "templates"]
`}</Code>
      <Code lang="text">{`
templates/pleate/emails/base.html            # your layout, logo and colors for every email
templates/pleate/emails/verify_email.html    # just this one
`}</Code>
      <Callout tone="tip">
        Keep the text version: some clients and every spam filter read it. Translate strings with{" "}
        <C>{"{% translate %}"}</C> so the email follows the user&apos;s language (see Internationalization).
      </Callout>

      <H2>Delivery</H2>
      <P>
        Delivery uses Django 6.1 mailers. SMTP is the default; Mailpit catches everything in development. For an email API
        install the <C>anymail</C> extra and swap the backend:
      </P>
      <Code lang="python" title="settings.py">{`
# SMTP (Mailpit in development)
MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
        "OPTIONS": {"host": "localhost", "port": 1025},
    }
}

# Resend, Postmark, SES, Mailgun... through django-anymail
MAILERS = {"default": {"BACKEND": "anymail.backends.resend.EmailBackend"}}
ANYMAIL = {"RESEND_API_KEY": env("RESEND_API_KEY")}

DEFAULT_FROM_EMAIL = "Plate <hello@plate.app>"
`}</Code>

      <H2>Settings</H2>
      <Settings
        rows={[
          ['PLEATE["EMAILS"]["ASYNC"]', "True", "Queue on Celery. False sends inline (tests, no worker)."],
          ["DEFAULT_FROM_EMAIL", '"no-reply@localhost"', "Sender of every email."],
          ['PLEATE["SITE_NAME"]', '"pleate"', "Name used in subjects and the layout."],
          ['PLEATE["FRONTEND_URL"]', '"http://localhost:3000"', "Base of every link."],
        ]}
      />
    </>
  );
}
