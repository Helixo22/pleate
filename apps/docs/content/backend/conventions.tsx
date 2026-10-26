import { C, Callout, Code, Endpoints, Errors, H2, H3, LI, P, Table, UL } from "@/components/backend/prose";

export default function Conventions() {
  return (
    <>
      <P>
        All paths in these guides are relative to where you mount <C>pleate_backend.urls</C>, normally <C>/api</C>. JSON
        in, JSON out, except uploads (multipart) and streams (Server-Sent Events). Ids are strings.
      </P>

      <H2>Lists</H2>
      <P>
        Every collection endpoint speaks the same query language, implemented once in <C>core.pagination</C> and{" "}
        <C>core.filters</C>. Two pagination modes exist.
      </P>
      <H3>Page mode, for tables</H3>
      <P>
        The default (<C>PagePagination</C>). Ideal for <C>DataTable</C> or <C>Table</C> with <C>Pagination</C>: the answer
        carries the total and the page count.
      </P>
      <Code lang="http">{`
GET /api/catalog/products?page=2&page_size=20&search=oat&ordering=-price,name&status=active

{"results": [...], "count": 134, "page": 2, "page_size": 20, "page_count": 7}
`}</Code>
      <H3>Cursor mode, for feeds</H3>
      <P>
        <C>CursorPagination</C>, newest first by <C>created_at</C>. Stable while new items arrive, so it is used by
        notifications, activity and chat history.
      </P>
      <Code lang="http">{`
GET /api/notifications?page_size=20&cursor=cD0yMDI2LTEw

{"results": [...], "next_cursor": "cD0yMDI2LTA5", "previous_cursor": null}
`}</Code>
      <Table
        head={["Param", "Example", "Meaning"]}
        mono={[0, 1]}
        rows={[
          ["page", "2", "Page number, from 1. Page mode only."],
          ["page_size", "50", "Items per page. Default 20, at most 100."],
          ["cursor", "cD0y…", "Opaque position. Cursor mode only."],
          ["search", "oat milk", "Case insensitive match over the view's search_fields."],
          ["ordering", "-price,name", "Comma separated, - for descending. Only ordering_fields are accepted."],
          ["<field>", "status=active", "Exact filters from filterset_fields or a FilterSet."],
        ]}
      />
      <P>
        A view opts in by declaring what is allowed. Anything else is rejected with a stable error rather than silently
        ignored:
      </P>
      <Code lang="python">{`
class ProductViewSet(viewsets.ModelViewSet):
    search_fields = ["name", "sku", "category"]
    ordering_fields = ["name", "price", "stock", "created_at"]
    ordering = ["-created_at"]
    filterset_fields = ["status", "category"]   # or filterset_class = ProductFilter
`}</Code>
      <P>
        For a feed, set <C>pagination_class = CursorPagination</C> from <C>pleate_backend.core.pagination</C>. The full
        recipe with a table is in Lists and tables.
      </P>

      <H2>Errors</H2>
      <P>
        Every error, from a missing field to a rate limit, has the same body. <C>code</C> is stable snake_case, safe to
        switch on or translate; <C>message</C> is already translated into the request&apos;s language; <C>fields</C> appears
        on validation errors with one list per field (nested fields use dots).
      </P>
      <Code lang="json">{`
{
  "error": {
    "status": 400,
    "code": "validation_error",
    "message": "Some fields are not valid.",
    "fields": {
      "email": [{ "code": "email_taken", "message": "An account with this email already exists." }],
      "password": [{ "code": "weak_password", "message": "This password is too common." }]
    }
  }
}
`}</Code>
      <P>
        Some errors carry extra keys: <C>retry_after</C> on 429, <C>attempts_left</C> on a wrong 2FA code,{" "}
        <C>max_size</C> or <C>quota</C> on uploads. In Python, raise <C>ApiError</C>:
      </P>
      <Code lang="python">{`
from django.utils.translation import gettext as _
from pleate_backend.core.exceptions import ApiError

raise ApiError("out_of_stock", _("This product is sold out."), 409, {"available": 0})
`}</Code>
      <P>
        In TypeScript every failed call throws <C>ApiError</C> with <C>status</C>, <C>code</C>, <C>fields</C>,{" "}
        <C>fieldErrors()</C> (first message per field, the shape pleate forms take) and <C>retryAfter</C>. A network
        failure has status 0 and code <C>network_error</C>.
      </P>
      <Code lang="ts">{`
import { isApiError } from "pleate-client";

try {
  await client.auth.login({ email, password, remember: true });
} catch (error) {
  if (isApiError(error, "too_many_attempts")) wait(error.retryAfter);
  else if (isApiError(error)) setFieldErrors(error.fieldErrors());
}
`}</Code>
      <H3>Common codes</H3>
      <Errors
        rows={[
          ["validation_error", "400", "One or more fields failed; see fields."],
          ["invalid_ordering", "400", "ordering names a field that is not in ordering_fields."],
          ["invalid_page", "404", "The page number is past the end."],
          ["not_authenticated", "401", "No session and no API key."],
          ["authentication_failed", "401", "Credentials were sent but are not valid."],
          ["permission_denied", "403", "Signed in, but not allowed."],
          ["csrf_failed", "403", "Unsafe request without a valid CSRF token. The client retries once on its own."],
          ["not_found", "404", "Missing, or belongs to another user (the API does not reveal which)."],
          ["throttled", "429", "Rate limit hit; retry_after says when to try again."],
          ["banned", "403", "The client address is in an active IP ban."],
        ]}
      />

      <H2>Authentication</H2>
      <P>Two ways to be someone, checked in this order on every request:</P>
      <UL>
        <LI>
          <strong>API key.</strong> <C>Authorization: Bearer pl_…</C>. For scripts and servers. No cookies, so no CSRF.
          Read only keys may only use GET, HEAD and OPTIONS. See API keys.
        </LI>
        <LI>
          <strong>Session cookie.</strong> Set by login, signup, OAuth or 2FA. <C>HttpOnly</C>, <C>SameSite=Lax</C>, two
          weeks by default (<C>SESSION_COOKIE_AGE</C>), one year with <C>remember</C> (<C>REMEMBER_ME_AGE</C>). Sessions are
          stored in MongoDB with device and IP, so users can list and revoke them.
        </LI>
      </UL>
      <P>
        The default permission is <C>IsAuthenticated</C>: an endpoint is private unless it says otherwise.
      </P>

      <H2>CSRF</H2>
      <P>
        Cookie authentication needs CSRF protection for POST, PUT, PATCH and DELETE. The flow is the standard Django one:
      </P>
      <Endpoints rows={[["GET", "/csrf", <>Sets the <C>csrftoken</C> cookie and returns <C>{"{csrf_token}"}</C>.</>]]} />
      <P>
        The client does this for you: before the first unsafe request it reads the <C>csrftoken</C> cookie (or calls{" "}
        <C>/csrf</C>) and sends it as <C>X-CSRFToken</C>. If the server answers <C>csrf_failed</C>, it refreshes the token
        and retries once. Login, signup, password reset and the other endpoints that set cookies for anonymous visitors
        enforce CSRF too (<C>CsrfProtectedMixin</C>), so another site cannot sign a victim into an attacker&apos;s account.
      </P>

      <H2>Rate limits</H2>
      <P>
        Throttled responses carry the standard headers, and a 429 has <C>retry_after</C> in the body. Scopes and their
        rates live in <C>{`REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`}</C>; see Rate limiting and cache.
      </P>
      <Code lang="http">{`
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 60
`}</Code>

      <H2>Language</H2>
      <P>
        Messages and emails are translated. The language is the <C>locale</C> cookie if set, else the signed in user&apos;s{" "}
        <C>locale</C>, else <C>Accept-Language</C>; responses say which one was used in <C>Content-Language</C>. Pass{" "}
        <C>locale</C> to the client to send <C>Accept-Language</C> explicitly. See Internationalization.
      </P>

      <H2>Other headers</H2>
      <UL>
        <LI>
          <C>X-Request-ID</C>: echoed if you send one (8 to 64 safe characters), generated otherwise. It appears in every
          JSON log line and in activity entries, so a user&apos;s bug report can be traced end to end.
        </LI>
        <LI>
          <C>ETag</C> and <C>If-None-Match</C>: views using <C>ETagMixin</C> answer 304 when nothing changed.
        </LI>
      </UL>
      <Callout title="OpenAPI">
        The schema is at <C>/api/schema</C> and a Swagger UI at <C>/api/docs</C>. Every pleate endpoint is annotated, so
        both are complete; annotate your own views with <C>extend_schema</C> to keep them that way.
      </Callout>
    </>
  );
}
