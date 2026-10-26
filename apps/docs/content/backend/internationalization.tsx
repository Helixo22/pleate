import { C, Callout, Code, H2, LI, P, Table, UL } from "@/components/backend/prose";

export default function Internationalization() {
  return (
    <>
      <P>
        Every human string in pleate-backend goes through Django&apos;s <C>gettext</C>: error messages, validation
        messages, email subjects and bodies. The package ships catalogs for English (the source), Italian and Spanish.
        Error <C>code</C>s never change with the language, so the frontend can switch on them or use its own wording.
      </P>

      <H2>How the language is picked</H2>
      <P><C>pleate_backend.core.middleware.LocaleMiddleware</C> picks, in order:</P>
      <Table
        head={["Source", "Set by"]}
        mono={[0]}
        rows={[
          ["locale cookie", <>Your language switcher, or <C>PATCH /auth/me</C> with <C>locale</C>, which sets it for a year.</>],
          ["user.locale", "Saved at signup (from the request) or in the profile. Copied to the cookie on the next response."],
          ["Accept-Language", <>The browser, or the client&apos;s <C>locale</C> option.</>],
        ]}
      />
      <P>
        Only languages in <C>LANGUAGES</C> are accepted; anything else falls back to <C>LANGUAGE_CODE</C>. Responses say
        which language was used in <C>Content-Language</C>.
      </P>
      <Code lang="http">{`
POST /api/auth/login
Accept-Language: it

HTTP/1.1 400 Bad Request
Content-Language: it

{"error": {"status": 400, "code": "invalid_credentials", "message": "Email o password sbagliate."}}
`}</Code>

      <H2>Emails</H2>
      <P>
        Emails are rendered in the recipient&apos;s language, not the language of whoever triggered them:{" "}
        <C>user.locale</C> when it is set, else the language of the current request. A staff member writing in English
        sends an Italian user an Italian reset email. Pass <C>language=</C> to <C>send_email</C> for your own emails.
      </P>

      <H2>From the frontend</H2>
      <Code lang="tsx">{`
// Follow the app's current locale on every request
<PleateProvider options={{ baseUrl: "/api", locale: () => document.documentElement.lang }}>

// Or remember the choice on the account (also sets the locale cookie)
const update = useUpdateMe();
update.mutate({ locale: "es" });
`}</Code>
      <P>
        <C>useSignup</C> sends <C>locale</C> when you pass it, so the verification email of a new account is already in
        the right language.
      </P>

      <H2>Adding a language</H2>
      <UL>
        <LI>Add it to <C>LANGUAGES</C> in your settings.</LI>
        <LI>Create a catalog for pleate&apos;s strings in one of your <C>LOCALE_PATHS</C>: copy <C>pleate_backend/locale/it/LC_MESSAGES/django.po</C> as a template, translate the <C>msgstr</C>s and compile.</LI>
        <LI>Translate your own strings as usual with <C>makemessages</C>.</LI>
      </UL>
      <Code lang="python" title="settings.py">{`
from pleate_backend.settings import LANGUAGES, LOCALE_PATHS

LANGUAGES = [*LANGUAGES, ("fr", "Français")]
LOCALE_PATHS = [BASE_DIR / "locale", *LOCALE_PATHS]   # yours first, they win
`}</Code>
      <Code lang="sh">{`python manage.py makemessages -l fr
python manage.py compilemessages`}</Code>
      <Callout tone="tip">
        Fixing a translation works the same way: put the corrected <C>msgid</C> in your own catalog. Catalogs earlier in{" "}
        <C>LOCALE_PATHS</C> take precedence.
      </Callout>

      <H2>Writing translatable code</H2>
      <UL>
        <LI>Use <C>gettext</C> in views and <C>gettext_lazy</C> at import time (serializer fields, model fields, class attributes).</LI>
        <LI>Raise errors with a stable code and a translated message: <C>{'ApiError("out_of_stock", _("This product is sold out."), 409)'}</C>.</LI>
        <LI>In templates, <C>{"{% load i18n %}"}</C> then <C>{"{% translate %}"}</C> and <C>{"{% blocktranslate %}"}</C>.</LI>
        <LI>Write English source strings; keep placeholders named (<C>{"%(email)s"}</C>) so translators can reorder them.</LI>
      </UL>
    </>
  );
}
