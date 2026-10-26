import { C, Callout, Code, H2, H3, P, Table } from "@/components/backend/prose";

const MODULES: [string, string][] = [
  ["auth", "csrf, me, updateMe, signup, login, logout, changePassword, requestPasswordReset, validateResetToken, resetPassword, verifyEmail, resendVerification, changeEmail, confirmEmailChange, uploadAvatar, removeAvatar, exportData, deleteAccount"],
  ["sessions", "list, revoke, revokeOthers"],
  ["mfa", "status, setup, confirm, disable, regenerateBackupCodes, verify"],
  ["oauth", "providers, startUrl (a URL to navigate to), accounts, unlink"],
  ["apiKeys", "list, create, rename, revoke"],
  ["files", "list, get, upload (with onProgress), rename, remove, usage, downloadUrl, presign, complete"],
  ["notifications", "list, unreadCount, markRead, markUnread, markAllRead, remove, clearRead, preferences, updatePreferences, stream (SSE), pushPublicKey, subscribePush, unsubscribePush"],
  ["ai", "models, suggestions, usage, conversations, createConversation, conversation, updateConversation, deleteConversation, messages, send (SSE), stop, regenerate (SSE)"],
  ["billing", "plans, subscription, checkout, portal"],
  ["marketing", "subscribe, confirmSubscription, unsubscribe, contact, joinWaitlist, waitlistStatus"],
  ["activity", "mine, all, get"],
  ["webhooks", "events, endpoints, createEndpoint, updateEndpoint, deleteEndpoint, rotateSecret, test, deliveries, delivery, redeliver"],
  ["rbac", "myFeatures, roles, createRole, updateRole, deleteRole, permissions, assignRole, removeRole, features"],
  ["staff", "users, user, updateUser, deleteUser, revokeSessions, sendPasswordReset, stats, bans, createBan, deleteBan"],
  ["list<T>(path, params)", "Any list endpoint of your own that follows the conventions → Page<T>."],
  ["http", "The underlying Http: get, post, put, patch, delete, raw, stream, upload, url, ensureCsrf."],
];

const HOOKS: [string, string, string][] = [
  ["useMe()", "user, isSignedIn, hasRole, hasPermission, hasFeature, query state", "Any component"],
  ["useUpdateMe()", "mutation, updates the cached user", "Profile forms"],
  ["useLogin({ onSuccess })", "loginFormProps, twoFactorFormProps, mfaRequired, reset, login, verify", "LoginForm, TwoFactorForm"],
  ["useSignup({ onSuccess })", "signupFormProps, verificationRequired, signup", "SignupForm"],
  ["useLogout({ onSuccess })", "mutation, clears the cache", "Any button"],
  ["useForgotPassword()", "forgotPasswordFormProps", "ForgotPasswordForm"],
  ["useResetPassword(token, { onSuccess })", "resetPasswordFormProps, tokenValid, checkingToken", "ResetPasswordForm"],
  ["useVerifyEmail(token)", "query of the verified user", "Verification page"],
  ["useTwoFactorSetup({ onDone })", "twoFactorSetupProps (after start), start, starting, status, enabled, disable", "TwoFactorSetup"],
  ["useOAuth({ next, mode, remember })", "oauthButtonsProps, providers query", "OAuthButtons"],
  ["useSocialAccounts()", "accounts query, unlink", "Linked accounts list"],
  ["useSessions()", "sessionListProps", "SessionList"],
  ["useApiKeys()", "apiKeyListProps", "ApiKeyList"],
  ["useList(path | fn, options)", "tableProps, paginationProps, searchProps, sortProps(key), rows, setters", "DataTable, Table, SearchBar, Pagination"],
  ["useCursorList(key, fetcher, options)", "items, fetchNextPage, hasNextPage", "Feeds, List"],
  ["useUpload({ purpose, onUploaded })", "fileUploadProps, uploaded, busy, add, remove, retry, clear", "FileUpload"],
  ["useNotifications({ live, pageSize, unreadOnly })", "notificationCenterProps, unreadCount, markRead, markAllRead, remove", "NotificationBell, NotificationCenter"],
  ["usePushSubscription()", "mutation taking a ServiceWorkerRegistration", "Push opt in"],
  ["useChat(id | null, { model, onConversation })", "composerProps, messages, streaming, error, send, stop, regenerate, loadOlder", "ChatThread, Message, Composer"],
  ["useModels(initial?)", "modelPickerProps, model, setModel", "ModelPicker"],
  ["useSuggestions(onSelect)", "promptSuggestionsProps", "PromptSuggestions"],
  ["useConversations({ archived })", "useList result for conversations", "Chat sidebar"],
  ["useAiUsage()", "query of today's tokens", "Quota meter"],
  ["usePricing({ isSignedIn, signInHref, renderCta })", "pricingProps, billing, setBilling, checkout, portal", "Pricing"],
  ["useSubscription()", "subscription, openPortal", "Billing settings"],
  ["useNewsletter({ source })", "newsletterProps, confirmationRequired", "Newsletter"],
  ["useContactForm()", "contactFormProps", "ContactForm"],
  ["useWaitlist()", "mutation returning position and referral code", "Waitlist form"],
];

export default function ClientAndHooks() {
  return (
    <>
      <P>
        <C>pleate-client</C> has two entry points. <C>pleate-client</C> is framework free: <C>createPleateClient()</C>,
        errors, list and SSE helpers, and the generated types. <C>pleate-client/react</C> adds a provider and hooks built
        on TanStack Query, each returning a <C>…Props</C> object to spread on a pleate component.
      </P>

      <H2>createPleateClient</H2>
      <Code lang="ts">{`
import { createPleateClient } from "pleate-client";

const client = createPleateClient({
  baseUrl: "/api",
  locale: () => document.documentElement.lang,
  onUnauthorized: () => location.assign("/login"),
});

const me = await client.auth.me();
const page = await client.files.list({ search: "receipt", ordering: "-created_at" });
for await (const event of client.ai.send(conversationId, { content: "Hello" })) {
  if (event.event === "delta") process.stdout.write(event.data.text);
}
`}</Code>
      <H3>Options</H3>
      <Table
        head={["Option", "Default", "Meaning"]}
        mono={[0, 1]}
        rows={[
          ["baseUrl", '"/api"', "Where pleate-backend is mounted. An absolute URL works too."],
          ["fetch", "globalThis.fetch", "Custom fetch: tests, or forwarding cookies on the server."],
          ["credentials", '"include"', "So the session cookie also travels on cross origin setups."],
          ["headers", "none", <>Extra headers, or a function returning them. E.g. <C>{"{ Authorization: \"Bearer pl_...\" }"}</C>.</>],
          ["locale", "none", <>Sent as <C>Accept-Language</C>. A string or a function.</>],
          ["csrf", "{ cookieName: \"csrftoken\", headerName: \"X-CSRFToken\", path: \"/csrf\" }", <><C>false</C> for API key clients.</>],
          ["onUnauthorized", "none", "Called on every 401."],
        ]}
      />
      <H3>Modules</H3>
      <Table head={["Module", "Methods"]} mono={[0]} rows={MODULES} />
      <P>
        Every method returns typed data and throws <C>ApiError</C> (<C>status</C>, <C>code</C>, <C>fields</C>,{" "}
        <C>fieldErrors()</C>, <C>retryAfter</C>) on failure. Streams are async generators of <C>{"{event, data}"}</C>; pass
        an <C>AbortSignal</C> to stop them. Types for every schema are available as <C>{'Schema<"Me">'}</C>, plus named
        aliases: <C>Me</C>, <C>Session</C>, <C>ApiKey</C>, <C>FileItem</C>, <C>Notification</C>, <C>Conversation</C>,{" "}
        <C>ChatMessage</C>, <C>Plan</C>, <C>ActivityLog</C>, <C>StaffUser</C>...
      </P>
      <H3>Helpers</H3>
      <Table
        head={["Export", "Does"]}
        mono={[0]}
        rows={[
          ["isApiError(error, code?)", "Type guard, optionally for one code."],
          ["toOrdering(sort) / fromOrdering(ordering)", <>Between <C>{'{key, direction}'}</C> and <C>-price</C>.</>],
          ["toSearchParams(params)", "Query string without empty values, arrays repeated."],
          ["parseSse(body, signal)", "Parses any text/event-stream body (fetch, POST included)."],
        ]}
      />

      <H2>React</H2>
      <Code lang="tsx">{`
<PleateProvider options={{ baseUrl: "/api" }}>          {/* or client={client} queryClient={queryClient} */}
  <App />
</PleateProvider>
`}</Code>
      <P>
        The provider creates the client and a <C>QueryClient</C> (30 second stale time, no retries on 401) unless you pass
        yours. <C>usePleateClient()</C> returns the client for calls without a hook; <C>keys</C> holds the query keys, so
        you can invalidate them (<C>{"queryClient.invalidateQueries({ queryKey: keys.apiKeys })"}</C>).
      </P>
      <H3>Hooks</H3>
      <Table head={["Hook", "Returns", "For"]} mono={[0]} rows={HOOKS} />
      <P>
        Every hook also spreads the underlying TanStack Query result (<C>data</C>, <C>isPending</C>, <C>error</C>,{" "}
        <C>refetch</C>...) or exposes its mutations, for anything the props do not cover.
      </P>

      <H2>Errors in forms</H2>
      <P>
        <C>errorProps(error)</C> turns any failure into the <C>error</C> and <C>fieldErrors</C> props every pleate form
        takes: field messages go under their inputs, everything else above the form. <C>mapFields</C> renames backend
        fields to form fields.
      </P>
      <Code lang="tsx">{`
import { errorProps, mapFields } from "pleate-client/react";

const save = useMutation({ mutationFn: client.auth.changePassword });
<PasswordForm
  onSubmit={(v) => save.mutate({ current_password: v.current, new_password: v.next })}
  {...mapFields(errorProps(save.error), { current_password: "current", new_password: "next" })}
/>
`}</Code>
      <Callout>
        The hooks are thin and built only on the public client. When a screen needs something
        they do not do, copy one and change it.
      </Callout>
    </>
  );
}
