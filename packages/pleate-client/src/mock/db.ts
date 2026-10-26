import type {
  ActivityLog,
  ApiKey,
  ChatMessage,
  Conversation,
  FileItem,
  Me,
  Notification,
  Schema,
  StaffUser,
  WebhookEndpoint,
} from "../api.ts";
import type { MockSseEvent } from "./sse.ts";
import { seed } from "./seed.ts";
import { createRandom, type Mutable, type Random } from "./util.ts";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  /** Plain text: this is a mock. `null` for accounts created through OAuth. */
  password: string | null;
  email_verified: boolean;
  locale: "" | "en" | "it" | "es";
  timezone: string;
  preferences: Record<string, unknown>;
  avatar: { bytes: Uint8Array; type: string; version: string } | null;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  roles: string[];
  mfa: {
    enabled: boolean;
    confirmed_at: string | null;
    /** Secret of an enrollment in progress. */
    pending_secret: string | null;
    backup_codes: string[];
  };
}

export type MockSession = Omit<Mutable<Schema<"Session">>, "current"> & { _owner: string };
export type MockApiKey = Mutable<ApiKey> & { _owner: string };
export type MockFile = Mutable<FileItem> & { _owner: string; _bytes: Uint8Array };
export type MockNotification = Mutable<Notification> & { _owner: string };
export type MockConversation = Mutable<Conversation> & { _owner: string };
export type MockMessage = Mutable<ChatMessage> & { _owner: string; _stop?: boolean };
export type MockActivity = Mutable<ActivityLog>;
export type MockEndpoint = Omit<Mutable<WebhookEndpoint>, "secret"> & { _owner: string; _secret: string };
export type MockDelivery = Mutable<Schema<"DeliveryDetail">> & { _owner: string };
export type MockSocialAccount = Mutable<Schema<"SocialAccount">> & { _owner: string };
export type MockSubscription = Mutable<Schema<"Subscription">> & { _owner: string };
export type MockRole = Mutable<Schema<"Role">>;
export type MockPermission = Mutable<Schema<"Permission">>;
export type MockFeature = Mutable<Schema<"Feature">>;
export type MockBan = Mutable<Schema<"Ban">>;
export type MockWaitlistEntry = { id: string; email: string; referral_code: string; referred_by: string | null; created_at: string; invited_at: string | null };
export type MockSubscriber = { id: string; email: string; status: "pending" | "subscribed" | "unsubscribed"; source: string; created_at: string };
export type MockContactMessage = { id: string; name: string; email: string; subject: string; message: string; status: "new" | "spam"; created_at: string };

/** A row of the generic `/catalog/products` collection. */
export interface MockProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  created_at: string;
  updated_at: string;
}

/** A plan as configured in `PLEATE["BILLING"]["PLANS"]`, amounts in cents. */
export interface MockPlanConfig {
  id: string;
  name: string;
  description: string;
  features: Schema<"Plan">["features"];
  highlighted?: boolean;
  badge?: string | null;
  cta?: string | null;
  prices?: { month?: number; year?: number };
  custom_price?: string | null;
}

export interface MockData {
  users: MockUser[];
  sessions: MockSession[];
  apiKeys: MockApiKey[];
  files: MockFile[];
  notifications: MockNotification[];
  notificationPrefs: Record<string, Record<string, string[]>>;
  pushSubscriptions: { endpoint: string; owner: string; created_at: string }[];
  conversations: MockConversation[];
  messages: MockMessage[];
  aiUsage: Record<string, { input_tokens: number; output_tokens: number }>;
  models: Schema<"ModelOption">[];
  defaultModel: string;
  suggestions: Schema<"Suggestion">[];
  plans: MockPlanConfig[];
  subscriptions: MockSubscription[];
  activity: MockActivity[];
  webhookEvents: Schema<"Event">[];
  endpoints: MockEndpoint[];
  deliveries: MockDelivery[];
  socialAccounts: MockSocialAccount[];
  roles: MockRole[];
  permissions: MockPermission[];
  features: MockFeature[];
  bans: MockBan[];
  products: MockProduct[];
  waitlist: MockWaitlistEntry[];
  subscribers: MockSubscriber[];
  contactMessages: MockContactMessage[];
}

export interface MockDbOptions {
  /** Seed of the pseudo random generator. Same seed, same data. */
  seed?: number;
  /** Reference time of the seed data. Defaults to the creation time. */
  now?: Date;
  /** Start signed in as the demo user (ada@plate.dev). Default true. */
  signedIn?: boolean;
  /** Signup answers `verification_required: true` and leaves the user signed out. Default false. */
  requireEmailVerification?: boolean;
}

export interface MockDb extends MockData {
  readonly options: Required<Omit<MockDbOptions, "now">> & { now?: Date };
  random: Random;
  /** Where the handlers are mounted, used to build avatar and download URLs. */
  baseUrl: string;
  /** The in memory "cookie": who is signed in, on which session. */
  auth: {
    userId: string | null;
    sessionId: string | null;
    pendingMfa: { userId: string; remember: boolean; attempts: number } | null;
  };
  /** New ObjectId like id (24 hex characters). */
  id(): string;
  now(): Date;
  user(id: string | null | undefined): MockUser | undefined;
  currentUser(): MockUser | null;
  /** The `/auth/me` payload. */
  me(user: MockUser): Me;
  staffUser(user: MockUser): StaffUser;
  /** Realtime channel `user:<id>`, used by the notifications stream. */
  publish(userId: string, event: MockSseEvent): void;
  subscribe(listener: (userId: string, event: MockSseEvent) => void): () => void;
  unreadCount(userId: string): number;
  log(action: string, user: MockUser | null, target?: { type: string; id: string; repr: string }, extra?: Partial<MockActivity>): void;
  /** Back to the seed data, signed in as configured. */
  reset(): void;
}

export const DEMO_EMAIL = "ada@plate.dev";
export const MFA_EMAIL = "mfa@plate.dev";
export const DEMO_PASSWORD = "plate-demo-2026";
export const DEMO_TOTP_CODE = "123456";
export const DEMO_BACKUP_CODE = "abcd-efgh";
/** The only password reset / email verification / newsletter token the mock accepts. */
export const VALID_TOKEN = "valid-token";

export function createMockDb(options: MockDbOptions = {}): MockDb {
  const resolved = {
    seed: options.seed ?? 2026,
    signedIn: options.signedIn ?? true,
    requireEmailVerification: options.requireEmailVerification ?? false,
    now: options.now,
  };
  const listeners = new Set<(userId: string, event: MockSseEvent) => void>();
  let counter = 0;

  const db = {
    options: resolved,
    baseUrl: "/api",
    auth: { userId: null, sessionId: null, pendingMfa: null } as MockDb["auth"],
    id() {
      counter += 1;
      const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
      return (time + db.random.chars(8, "0123456789abcdef") + counter.toString(16).padStart(8, "0")).slice(0, 24);
    },
    now: () => new Date(),
    user(id: string | null | undefined) {
      return id ? db.users.find((u) => u.id === id) : undefined;
    },
    currentUser() {
      const user = db.user(db.auth.userId);
      return user && user.is_active ? user : null;
    },
    me(user: MockUser): Me {
      const roles = db.roles.filter((r) => user.roles.includes(r.name));
      const permissions = [...new Set(roles.flatMap((r) => r.permissions ?? []))].sort();
      const sub = activeSubscription(db, user.id);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        display_name: user.name || user.email.split("@")[0],
        email_verified: user.email_verified,
        locale: user.locale,
        timezone: user.timezone,
        preferences: user.preferences,
        avatar_url: user.avatar ? `${db.baseUrl}/auth/avatar/${user.id}?v=${user.avatar.version}` : null,
        has_password: user.password !== null,
        is_staff: user.is_staff,
        date_joined: user.date_joined,
        extra: {
          roles: [...user.roles],
          permissions,
          features: enabledFeatures(db, user),
          mfa_enabled: user.mfa.enabled,
          oauth_providers: db.socialAccounts.filter((a) => a._owner === user.id).map((a) => a.provider),
          subscription: sub
            ? {
                plan_id: sub.plan_id,
                status: sub.status,
                current_period_end: sub.current_period_end,
                cancel_at_period_end: sub.cancel_at_period_end,
              }
            : null,
        },
      };
    },
    staffUser(user: MockUser): StaffUser {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        display_name: user.name || user.email.split("@")[0],
        avatar_url: user.avatar ? `${db.baseUrl}/auth/avatar/${user.id}?v=${user.avatar.version}` : null,
        email_verified: user.email_verified,
        is_active: user.is_active,
        is_staff: user.is_staff,
        is_superuser: user.is_superuser,
        date_joined: user.date_joined,
        last_login: user.last_login,
        roles: [...user.roles],
      };
    },
    publish(userId: string, event: MockSseEvent) {
      for (const listener of listeners) listener(userId, event);
    },
    subscribe(listener: (userId: string, event: MockSseEvent) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    unreadCount(userId: string) {
      return db.notifications.filter((n) => n._owner === userId && !n.read).length;
    },
    log(action, user, target, extra = {}) {
      db.activity.unshift({
        id: db.id(),
        actor: user?.id ?? null,
        actor_email: user?.email ?? "",
        action,
        target_type: target?.type ?? "",
        target_id: target?.id ?? "",
        target_repr: target?.repr ?? "",
        changes: {},
        metadata: {},
        ip: "203.0.113.24",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Chrome/129.0 Safari/537.36",
        request_id: db.random.chars(16, "0123456789abcdef"),
        created_at: new Date().toISOString(),
        ...extra,
      });
    },
    reset() {
      counter = 0;
      db.random = createRandom(resolved.seed);
      Object.assign(db, seed(db, resolved.now ?? new Date()));
      const ada = db.users.find((u) => u.email === DEMO_EMAIL)!;
      const current = db.sessions.find((s) => s._owner === ada.id && s.browser === "Chrome");
      db.auth = resolved.signedIn
        ? { userId: ada.id, sessionId: current?.id ?? null, pendingMfa: null }
        : { userId: null, sessionId: null, pendingMfa: null };
    },
  } satisfies Partial<MockDb> as unknown as MockDb;
  db.reset();
  return db;
}

export function activeSubscription(db: MockData, userId: string): MockSubscription | undefined {
  return db.subscriptions.find(
    (s) => s._owner === userId && ["active", "trialing", "past_due"].includes(s.status),
  );
}

function bucket(key: string, userId: string): number {
  let hash = 0;
  for (const ch of `${key}:${userId}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 100;
}

export function enabledFeatures(db: MockData, user: MockUser): string[] {
  return db.features
    .filter(
      (f) =>
        f.enabled ||
        f.users?.includes(user.id) ||
        f.groups?.some((g) => user.roles.includes(g)) ||
        bucket(f.key, user.id) < (f.rollout_percent ?? 0),
    )
    .map((f) => f.key)
    .sort();
}
