import { Http, type HttpOptions, type UploadOptions } from "./http.ts";
import type { CursorPage, CursorParams, ListParams, Page } from "./list.ts";
import type { components } from "./schema.ts";
import type { SseEvent } from "./sse.ts";

/** Any schema of the pleate-backend OpenAPI document: `Schema<"Me">`. */
export type Schema<K extends keyof components["schemas"]> = components["schemas"][K];

/** Fields other apps add to `/auth/me` (`extra`). Absent when the app is not installed. */
export interface MeExtra {
  roles?: string[];
  permissions?: string[];
  features?: string[];
  mfa_enabled?: boolean;
  oauth_providers?: string[];
  subscription?: {
    plan_id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
}

export type Me = Omit<Schema<"Me">, "extra"> & { extra: MeExtra };
export type LoginResult = { user?: Me; mfa_required: boolean; methods?: string[] };
export type SignupResult = { user: Me; verification_required: boolean };
export type Session = Schema<"Session">;
export type ApiKey = Schema<"APIKey">;
export type ApiKeyCreated = Schema<"APIKeyCreated">;
export type FileItem = Schema<"File">;
export type Notification = Schema<"Notification">;
export type Conversation = Schema<"Conversation">;
export type ChatMessage = Schema<"Message">;
export type Plan = Schema<"Plan">;
export type Plans = Schema<"Plans">;
export type ActivityLog = Schema<"ActivityLog">;
export type WebhookEndpoint = Schema<"Endpoint">;
export type WebhookDelivery = Schema<"Delivery">;
export type StaffUser = Schema<"StaffUser">;

/** Events of the chat stream, in order: user_message?, start, (reasoning|sources|delta)*, error?, done. */
export type ChatEvent =
  | { event: "user_message"; data: { message: ChatMessage } }
  | { event: "start"; data: { message: ChatMessage } }
  | { event: "delta"; data: { text: string } }
  | { event: "reasoning"; data: { text: string } }
  | { event: "sources"; data: { sources: Schema<"Source">[] } }
  | { event: "error"; data: { code: string; message: string; message_id?: string } }
  | { event: "done"; data: { message: ChatMessage } };

export type NotificationEvent =
  | { event: "notification"; data: Notification }
  | { event: "unread_count"; data: { count: number } };

const enc = encodeURIComponent;

export function createPleateClient(options: HttpOptions = {}) {
  const http = new Http(options);

  const auth = {
    csrf: () => http.ensureCsrf(),
    me: () => http.get<Me>("/auth/me"),
    updateMe: (body: Schema<"PatchedMeRequest">) => http.patch<Me>("/auth/me", body),
    signup: (body: Schema<"SignupRequest">) => http.post<SignupResult>("/auth/signup", body),
    login: (body: Schema<"LoginRequest">) => http.post<LoginResult>("/auth/login", body),
    logout: () => http.post<void>("/auth/logout"),
    changePassword: (body: Schema<"PasswordChangeRequest">) => http.post<void>("/auth/password/change", body),
    requestPasswordReset: (email: string) => http.post<void>("/auth/password/reset", { email }),
    validateResetToken: (token: string) =>
      http.post<{ valid: boolean }>("/auth/password/reset/validate", { token }),
    resetPassword: (token: string, new_password: string) =>
      http.post<void>("/auth/password/reset/confirm", { token, new_password }),
    verifyEmail: (token: string) => http.post<Me>("/auth/email/verify", { token }),
    resendVerification: () => http.post<void>("/auth/email/verify/resend"),
    changeEmail: (new_email: string, password?: string) =>
      http.post<void>("/auth/email/change", { new_email, password }),
    confirmEmailChange: (token: string) => http.post<Me>("/auth/email/change/confirm", { token }),
    uploadAvatar: (file: File | Blob, opts?: UploadOptions) => {
      const form = new FormData();
      form.append("file", file);
      return http.upload<Me>("PUT", "/auth/me/avatar", form, opts);
    },
    removeAvatar: () => http.delete<Me>("/auth/me/avatar"),
    exportData: () => http.get<Record<string, unknown>>("/auth/me/export"),
    deleteAccount: (body: { password?: string; confirm_email?: string }) => http.delete<void>("/auth/me", body),
  };

  const sessions = {
    list: () => http.get<Session[]>("/auth/sessions"),
    revoke: (id: string) => http.delete<void>(`/auth/sessions/${enc(id)}`),
    revokeOthers: () => http.post<{ count: number }>("/auth/sessions/revoke-others"),
  };

  const mfa = {
    status: () => http.get<Schema<"MfaStatus">>("/auth/mfa"),
    setup: () => http.post<Schema<"MfaSetupResponse">>("/auth/mfa/setup"),
    confirm: (code: string) => http.post<Schema<"MfaBackupCodes">>("/auth/mfa/confirm", { code }),
    disable: (body: Schema<"MfaDisableRequest">) => http.post<void>("/auth/mfa/disable", body),
    regenerateBackupCodes: (code: string) => http.post<Schema<"MfaBackupCodes">>("/auth/mfa/backup-codes", { code }),
    /** Second step of a login that answered `mfa_required`. */
    verify: (body: { code?: string; backup_code?: string }) =>
      http.post<{ user: Me; mfa_required: false }>("/auth/mfa/verify", body),
  };

  const oauth = {
    providers: () => http.get<Schema<"OAuthProvider">[]>("/auth/oauth/providers"),
    /** URL to navigate to (full page) to sign in or link a provider. */
    startUrl: (provider: string, opts: { next?: string; mode?: "login" | "link"; remember?: boolean } = {}) =>
      http.url(`/auth/oauth/${enc(provider)}/start`, {
        next: opts.next,
        mode: opts.mode,
        remember: opts.remember ? 1 : undefined,
      }),
    accounts: () => http.get<Schema<"SocialAccount">[]>("/auth/oauth/accounts"),
    unlink: (id: string) => http.delete<void>(`/auth/oauth/accounts/${enc(id)}`),
  };

  const apiKeys = {
    list: (params?: ListParams) => http.get<Page<ApiKey>>("/api-keys", params),
    create: (body: Schema<"APIKeyCreateRequest">) => http.post<ApiKeyCreated>("/api-keys", body),
    rename: (id: string, name: string) => http.patch<ApiKey>(`/api-keys/${enc(id)}`, { name }),
    revoke: (id: string) => http.delete<void>(`/api-keys/${enc(id)}`),
  };

  const files = {
    list: (params?: ListParams) => http.get<Page<FileItem>>("/files", params),
    get: (id: string) => http.get<FileItem>(`/files/${enc(id)}`),
    upload: (file: File | Blob, opts: UploadOptions & { purpose?: string } = {}) => {
      const form = new FormData();
      form.append("file", file);
      if (opts.purpose) form.append("purpose", opts.purpose);
      return http.upload<FileItem>("POST", "/files", form, opts);
    },
    rename: (id: string, name: string) => http.patch<FileItem>(`/files/${enc(id)}`, { name }),
    remove: (id: string) => http.delete<void>(`/files/${enc(id)}`),
    usage: () => http.get<Schema<"FileUsage">>("/files/usage"),
    downloadUrl: (id: string, inline = false) => http.url(`/files/${enc(id)}/download`, { inline: inline ? 1 : undefined }),
    presign: (body: Schema<"PresignRequest">) => http.post<Schema<"PresignResponse">>("/files/presign", body),
    complete: (id: string) => http.post<FileItem>(`/files/${enc(id)}/complete`),
  };

  const notifications = {
    list: (params?: CursorParams & { unread?: boolean; kind?: string }) =>
      http.get<CursorPage<Notification>>("/notifications", params),
    unreadCount: () => http.get<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) => http.post<Notification>(`/notifications/${enc(id)}/read`),
    markUnread: (id: string) => http.post<Notification>(`/notifications/${enc(id)}/unread`),
    markAllRead: () => http.post<{ count: number }>("/notifications/read-all"),
    remove: (id: string) => http.delete<void>(`/notifications/${enc(id)}`),
    clearRead: () => http.delete<{ count: number }>("/notifications"),
    preferences: () => http.get<Schema<"Preferences">>("/notifications/preferences"),
    updatePreferences: (channels: Record<string, string[]>) =>
      http.put<Schema<"Preferences">>("/notifications/preferences", { channels }),
    /** Live events (SSE). Iterate it; abort the signal to stop. */
    stream: (signal?: AbortSignal) =>
      http.stream("GET", "/notifications/stream", { signal }) as AsyncGenerator<NotificationEvent & SseEvent>,
    pushPublicKey: () => http.get<{ key: string }>("/notifications/push/public-key"),
    subscribePush: (subscription: PushSubscriptionJSON) =>
      http.post<void>("/notifications/push/subscriptions", {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }),
    unsubscribePush: (endpoint: string) => http.delete<void>("/notifications/push/subscriptions", { endpoint }),
  };

  const ai = {
    models: () => http.get<Schema<"ModelsResponse">>("/ai/models"),
    suggestions: () => http.get<Schema<"Suggestion">[]>("/ai/suggestions"),
    usage: () => http.get<Schema<"Usage">>("/ai/usage"),
    conversations: (params?: ListParams & { archived?: boolean; pinned?: boolean }) =>
      http.get<Page<Conversation>>("/ai/conversations", params),
    createConversation: (body: Schema<"ConversationRequest"> = {}) =>
      http.post<Conversation>("/ai/conversations", body),
    conversation: (id: string) => http.get<Conversation>(`/ai/conversations/${enc(id)}`),
    updateConversation: (id: string, body: Schema<"PatchedConversationRequest">) =>
      http.patch<Conversation>(`/ai/conversations/${enc(id)}`, body),
    deleteConversation: (id: string) => http.delete<void>(`/ai/conversations/${enc(id)}`),
    /** Latest page first; each page is in chronological order. */
    messages: (id: string, params?: CursorParams) =>
      http.get<CursorPage<ChatMessage>>(`/ai/conversations/${enc(id)}/messages`, params),
    /** Sends a message and streams the answer. */
    send: (id: string, body: Schema<"SendMessageRequest">, signal?: AbortSignal) =>
      http.stream("POST", `/ai/conversations/${enc(id)}/messages`, { body, signal }) as AsyncGenerator<ChatEvent>,
    /** 202 with the message; the running stream then ends with `done` and status "stopped". */
    stop: (messageId: string) => http.post<ChatMessage>(`/ai/messages/${enc(messageId)}/stop`),
    regenerate: (messageId: string, body: Schema<"RegenerateRequest"> = {}, signal?: AbortSignal) =>
      http.stream("POST", `/ai/messages/${enc(messageId)}/regenerate`, { body, signal }) as AsyncGenerator<ChatEvent>,
  };

  const billing = {
    plans: () => http.get<Plans>("/billing/plans"),
    subscription: () => http.get<{ subscription: Schema<"Subscription"> | null }>("/billing/subscription"),
    checkout: (plan: string, interval: "month" | "year") =>
      http.post<{ url: string }>("/billing/checkout", { plan, interval }),
    portal: () => http.post<{ url: string }>("/billing/portal"),
  };

  const marketing = {
    subscribe: (email: string, source?: string) =>
      http.post<Schema<"SubscribeResponse">>("/marketing/newsletter/subscribe", { email, source }),
    confirmSubscription: (token: string) =>
      http.post<Schema<"NewsletterStatus">>("/marketing/newsletter/confirm", { token }),
    unsubscribe: (token: string) => http.post<Schema<"NewsletterStatus">>("/marketing/newsletter/unsubscribe", { token }),
    contact: (body: Schema<"ContactRequest">) => http.post<Schema<"ContactResponse">>("/marketing/contact", body),
    joinWaitlist: (email: string, ref?: string) =>
      http.post<Schema<"WaitlistStatus">>("/marketing/waitlist", { email, ref }),
    waitlistStatus: (code: string) => http.get<Schema<"WaitlistPublicStatus">>(`/marketing/waitlist/${enc(code)}`),
  };

  const activity = {
    mine: (params?: CursorParams & { action?: string; action__startswith?: string }) =>
      http.get<CursorPage<ActivityLog>>("/activity", params),
    all: (params?: ListParams) => http.get<Page<ActivityLog>>("/activity/all", params),
    get: (id: string) => http.get<ActivityLog>(`/activity/all/${enc(id)}`),
  };

  const webhooks = {
    events: () => http.get<Schema<"Event">[]>("/webhooks/events"),
    endpoints: (params?: ListParams) => http.get<Page<WebhookEndpoint>>("/webhooks/endpoints", params),
    createEndpoint: (body: Schema<"EndpointRequest">) =>
      http.post<Schema<"EndpointCreated">>("/webhooks/endpoints", body),
    updateEndpoint: (id: string, body: Schema<"PatchedEndpointRequest">) =>
      http.patch<WebhookEndpoint>(`/webhooks/endpoints/${enc(id)}`, body),
    deleteEndpoint: (id: string) => http.delete<void>(`/webhooks/endpoints/${enc(id)}`),
    rotateSecret: (id: string) => http.post<{ secret: string }>(`/webhooks/endpoints/${enc(id)}/rotate-secret`),
    test: (id: string) => http.post<Schema<"TestResult">>(`/webhooks/endpoints/${enc(id)}/test`),
    deliveries: (id: string, params?: ListParams) =>
      http.get<Page<WebhookDelivery>>(`/webhooks/endpoints/${enc(id)}/deliveries`, params),
    delivery: (id: string) => http.get<Schema<"DeliveryDetail">>(`/webhooks/deliveries/${enc(id)}`),
    redeliver: (id: string) => http.post<WebhookDelivery>(`/webhooks/deliveries/${enc(id)}/redeliver`),
  };

  const rbac = {
    myFeatures: () => http.get<Schema<"FeatureKeys">>("/rbac/features/me"),
    roles: (params?: ListParams) => http.get<Page<Schema<"Role">>>("/rbac/roles", params),
    createRole: (body: Schema<"RoleRequest">) => http.post<Schema<"Role">>("/rbac/roles", body),
    updateRole: (id: string, body: Schema<"PatchedRoleRequest">) =>
      http.patch<Schema<"Role">>(`/rbac/roles/${enc(id)}`, body),
    deleteRole: (id: string) => http.delete<void>(`/rbac/roles/${enc(id)}`),
    permissions: (params?: ListParams) => http.get<Page<Schema<"Permission">>>("/rbac/permissions", params),
    assignRole: (userId: string, role: string) =>
      http.post<Schema<"UserRoles">>(`/rbac/users/${enc(userId)}/roles`, { role }),
    removeRole: (userId: string, role: string) =>
      http.delete<Schema<"UserRoles">>(`/rbac/users/${enc(userId)}/roles`, { role }),
    features: (params?: ListParams) => http.get<Page<Schema<"Feature">>>("/rbac/features", params),
  };

  const staff = {
    users: (params?: ListParams) => http.get<Page<StaffUser>>("/staff/users", params),
    user: (id: string) => http.get<Schema<"StaffUserDetail">>(`/staff/users/${enc(id)}`),
    updateUser: (id: string, body: Schema<"PatchedStaffUserUpdateRequest">) =>
      http.patch<Schema<"StaffUserDetail">>(`/staff/users/${enc(id)}`, body),
    deleteUser: (id: string) => http.delete<void>(`/staff/users/${enc(id)}`),
    revokeSessions: (id: string) => http.post<{ count: number }>(`/staff/users/${enc(id)}/revoke-sessions`),
    sendPasswordReset: (id: string) => http.post<void>(`/staff/users/${enc(id)}/password-reset`),
    stats: () => http.get<Schema<"Stats">>("/staff/stats"),
    bans: (params?: ListParams) => http.get<Page<Schema<"Ban">>>("/staff/bans", params),
    createBan: (body: Schema<"BanRequest">) => http.post<Schema<"Ban">>("/staff/bans", body),
    deleteBan: (id: string) => http.delete<void>(`/staff/bans/${enc(id)}`),
  };

  return {
    http,
    auth,
    sessions,
    mfa,
    oauth,
    apiKeys,
    files,
    notifications,
    ai,
    billing,
    marketing,
    activity,
    webhooks,
    rbac,
    staff,
    /** Any list endpoint of your own project that follows the conventions. */
    list: <T>(path: string, params?: ListParams) => http.get<Page<T>>(path, params),
  };
}

export type PleateClient = ReturnType<typeof createPleateClient>;
