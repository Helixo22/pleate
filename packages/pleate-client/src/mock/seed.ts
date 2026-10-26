import type {
  MockActivity,
  MockApiKey,
  MockConversation,
  MockData,
  MockDb,
  MockDelivery,
  MockEndpoint,
  MockFile,
  MockMessage,
  MockNotification,
  MockPlanConfig,
  MockProduct,
  MockSession,
  MockUser,
} from "./db.ts";
import { DEMO_BACKUP_CODE, DEMO_EMAIL, DEMO_PASSWORD, MFA_EMAIL } from "./db.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const USER_AGENTS = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  firefoxWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
};

/** Same idea as accounts.services.describe_user_agent. */
export function describeUserAgent(ua: string): { browser: string; os: string; mobile: boolean } {
  const l = ua.toLowerCase();
  const browser =
    [
      ["edg/", "Edge"],
      ["opr/", "Opera"],
      ["firefox/", "Firefox"],
      ["chrome/", "Chrome"],
      ["safari/", "Safari"],
    ].find(([key]) => l.includes(key))?.[1] ?? "Unknown browser";
  const os =
    [
      ["iphone", "iOS"],
      ["ipad", "iPadOS"],
      ["android", "Android"],
      ["windows", "Windows"],
      ["mac os x", "macOS"],
      ["linux", "Linux"],
    ].find(([key]) => l.includes(key))?.[1] ?? "Unknown OS";
  return { browser, os, mobile: /mobile|iphone|android/.test(l) };
}

const FIRST = [
  "Linus", "Maya", "Noor", "Tomas", "Ines", "Kenji", "Amara", "Felix", "Sofia", "Omar", "Elena", "Rafael",
  "Hana", "Marco", "Zoe", "Arjun", "Clara", "Mateo", "Leila", "Jonas", "Priya", "Luca", "Freya", "Diego",
  "Yara", "Emil", "Nadia", "Theo",
];
const LAST = [
  "Okafor", "Lindqvist", "Haddad", "Novak", "Ferreira", "Tanaka", "Mensah", "Becker", "Rossi", "Farouk",
  "Ivanova", "Castillo", "Kim", "Bianchi", "Dubois", "Raman", "Weber", "Silva", "Nasser", "Berg", "Shah",
  "Conti", "Larsen", "Ortega",
];

const CATALOG: Record<string, string[]> = {
  Tableware: ["Dinner Plate", "Side Plate", "Pasta Bowl", "Serving Platter", "Mug", "Espresso Cup", "Salad Bowl"],
  Kitchen: ["Chef Knife", "Cutting Board", "Saucepan", "Mixing Bowl", "Utensil Set", "Dutch Oven"],
  Textiles: ["Napkin Set", "Table Runner", "Apron", "Tea Towel", "Placemat Set"],
  Glassware: ["Wine Glass", "Tumbler", "Carafe", "Water Jug"],
  Lighting: ["Pendant Lamp", "Table Lamp", "Candle Holder"],
  Storage: ["Pantry Jar", "Bread Bin", "Spice Rack", "Butter Dish"],
};
const MATERIALS: Record<string, string[]> = {
  Tableware: ["Stoneware", "Porcelain", "Speckled", "Matte Black", "Terracotta", "Celadon"],
  Kitchen: ["Walnut", "Oak", "Copper", "Cast Iron", "Carbon Steel", "Olive Wood"],
  Textiles: ["Linen", "Washed Cotton", "Hemp", "Waffle", "Indigo"],
  Glassware: ["Recycled Glass", "Crystal", "Smoked", "Ribbed"],
  Lighting: ["Brass", "Rattan", "Opal Glass", "Ceramic"],
  Storage: ["Enamel", "Bamboo", "Marble", "Glass"],
};

const PLANS: MockPlanConfig[] = [
  {
    id: "free",
    name: "Free",
    description: "For trying Plate on a side project.",
    features: [
      "1 catalog, up to 200 products",
      "Community support",
      { label: "Custom domain", included: false },
      { label: "Team members", included: false, hint: "Available on Team" },
    ],
    cta: "Get started",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For a growing shop with a real audience.",
    features: [
      "Unlimited products",
      "Custom domain",
      "AI product descriptions",
      { label: "Priority support", included: true, hint: "Answers within a business day" },
      { label: "Team members", included: false, hint: "Available on Team" },
    ],
    highlighted: true,
    badge: "Most popular",
    cta: "Start free trial",
    prices: { month: 1200, year: 12000 },
  },
  {
    id: "team",
    name: "Team",
    description: "For studios that run several shops together.",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Roles and audit log",
      "Webhooks and API access",
      { label: "Single sign on", included: true, hint: "Google and GitHub" },
    ],
    cta: "Choose Team",
    prices: { month: 4900, year: 46800 },
  },
];

const NOTIFICATIONS: { kind: string; title: string; body: string; url: string }[] = [
  { kind: "billing.payment_failed", title: "Payment failed", body: "We could not charge your card ending in 4242. Update it to keep Plate Pro.", url: "/settings/billing" },
  { kind: "comment.mention", title: "Grace mentioned you", body: "Can you check the plating guide before Friday?", url: "/projects/spring-menu" },
  { kind: "security.new_login", title: "New sign in from Safari on iPhone", body: "Rome, Italy. If this was not you, revoke the session.", url: "/settings/security" },
  { kind: "inventory.low_stock", title: "Low stock", body: "Speckled Dinner Plate has 4 units left.", url: "/catalog?low_stock=true" },
  { kind: "export.ready", title: "Export ready", body: "Your catalog export with 120 products is ready to download.", url: "/files" },
  { kind: "team.joined", title: "Linus joined your team", body: "Linus Okafor accepted the invite to the Kitchen team.", url: "/settings/team" },
  { kind: "billing.invoice_paid", title: "Invoice paid", body: "Invoice PL-2026-0142 for $12.00 was paid. Thank you!", url: "/settings/billing" },
  { kind: "system.maintenance", title: "Scheduled maintenance", body: "Plate will be read only on Sunday from 02:00 to 02:30 UTC.", url: "" },
  { kind: "webhook.disabled", title: "Webhook endpoint disabled", body: "https://legacy.plate.dev/hooks failed 20 times in a row.", url: "/settings/webhooks" },
  { kind: "report.weekly", title: "Your weekly report", body: "Orders are up 12% compared to last week.", url: "/reports" },
  { kind: "order.created", title: "New order #1042", body: "Maya Lindqvist ordered 2 items for $86.00.", url: "/orders/1042" },
  { kind: "comment.reply", title: "Noor replied to your comment", body: "Agreed, the oak boards photograph much better.", url: "/projects/photo-shoot" },
];

/** Notifications pushed on the live stream while it is open. */
export const LIVE_NOTIFICATIONS: { kind: string; title: string; body: string; url: string }[] = [
  { kind: "order.created", title: "New order #1043", body: "Tomas Novak ordered a Linen Napkin Set for $34.00.", url: "/orders/1043" },
  { kind: "inventory.low_stock", title: "Low stock", body: "Walnut Cutting Board has 3 units left.", url: "/catalog?low_stock=true" },
  { kind: "comment.mention", title: "Ines mentioned you", body: "The new glaze samples arrived, take a look.", url: "/projects/glaze" },
  { kind: "order.created", title: "New order #1044", body: "Kenji Tanaka ordered 6 items for $212.00.", url: "/orders/1044" },
  { kind: "review.new", title: "New 5 star review", body: "\"The pasta bowls are perfect.\" on Celadon Pasta Bowl.", url: "/reviews" },
];

export function seed(db: MockDb, nowDate: Date): MockData {
  const r = db.random;
  const now = nowDate.getTime();
  const at = (offset: number) => new Date(now - offset).toISOString();
  const id = () => db.id();

  // Users
  const ada: MockUser = {
    id: id(),
    email: DEMO_EMAIL,
    name: "Ada Palmer",
    password: DEMO_PASSWORD,
    email_verified: true,
    locale: "en",
    timezone: "Europe/Rome",
    preferences: { theme: "system" },
    avatar: null,
    is_staff: true,
    is_superuser: false,
    is_active: true,
    date_joined: at(412 * DAY),
    last_login: at(2 * HOUR),
    roles: ["admin"],
    mfa: { enabled: false, confirmed_at: null, pending_secret: null, backup_codes: [] },
  };
  const grace: MockUser = {
    ...ada,
    id: id(),
    email: MFA_EMAIL,
    name: "Grace Moreno",
    preferences: {},
    is_staff: false,
    timezone: "America/New_York",
    date_joined: at(260 * DAY),
    last_login: at(3 * DAY),
    roles: ["editor"],
    mfa: {
      enabled: true,
      confirmed_at: at(90 * DAY),
      pending_secret: null,
      backup_codes: [DEMO_BACKUP_CODE, "k3f9-x2m8", "p7qd-4nzt", "w2hc-9vbe", "r6ty-m3ua"],
    },
  };
  const users: MockUser[] = [ada, grace];
  const used = new Set(users.map((u) => u.email));
  for (let i = 0; users.length < 58; i++) {
    const first = r.pick(FIRST);
    const last = r.pick(LAST);
    const email = `${first}.${last}`.toLowerCase() + (r.bool(0.3) ? "@gmail.com" : "@plate.dev");
    if (used.has(email)) continue;
    used.add(email);
    const joined = r.int(1, 700) * DAY + r.int(0, 23) * HOUR;
    users.push({
      ...ada,
      id: id(),
      email,
      name: `${first} ${last}`,
      password: r.bool(0.85) ? DEMO_PASSWORD : null,
      email_verified: r.bool(0.85),
      locale: r.pick(["en", "en", "it", "es"] as const),
      timezone: r.pick(["Europe/Rome", "Europe/Berlin", "America/New_York", "Asia/Tokyo", "UTC"]),
      preferences: {},
      is_staff: r.bool(0.08),
      is_active: r.bool(0.92),
      date_joined: at(joined),
      last_login: r.bool(0.85) ? at(r.int(1, Math.max(2, Math.floor(joined / HOUR))) * HOUR) : null,
      roles: r.bool(0.2) ? ["editor"] : ["viewer"],
      mfa: { enabled: r.bool(0.2), confirmed_at: null, pending_secret: null, backup_codes: [] },
    });
  }

  // Sessions of the demo users
  const session = (owner: string, ua: string, ip: string, created: number, seen: number): MockSession => ({
    id: r.chars(24, "0123456789abcdef"),
    ip,
    user_agent: ua,
    ...describeUserAgent(ua),
    created_at: at(created),
    last_seen_at: at(seen),
    expires_at: new Date(now + 14 * DAY - created).toISOString(),
    _owner: owner,
  });
  const sessions = [
    session(ada.id, USER_AGENTS.chromeMac, "203.0.113.24", 2 * DAY, 1 * MIN),
    session(ada.id, USER_AGENTS.safariIphone, "198.51.100.7", 6 * DAY, 3 * HOUR),
    session(ada.id, USER_AGENTS.firefoxWindows, "192.0.2.144", 11 * DAY, 4 * DAY),
    session(grace.id, USER_AGENTS.chromeMac, "198.51.100.90", 3 * DAY, 3 * DAY),
  ];

  // API keys
  const apiKey = (
    name: string,
    scopes: ("read" | "write")[],
    created: number,
    extra: Partial<MockApiKey> = {},
  ): MockApiKey => {
    const prefix = r.chars(8, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789");
    return {
      id: id(),
      name,
      prefix,
      display: `pl_${prefix}_...`,
      scopes,
      status: "active",
      expires_at: null,
      last_used_at: null,
      last_used_ip: "",
      created_at: at(created),
      revoked_at: null,
      _owner: ada.id,
      ...extra,
    };
  };
  const apiKeys = [
    apiKey("Production deploys", ["read", "write"], 120 * DAY, { last_used_at: at(2 * HOUR), last_used_ip: "34.120.18.9" }),
    apiKey("Analytics export", ["read"], 45 * DAY, {
      expires_at: new Date(now + 60 * DAY).toISOString(),
      last_used_at: at(1 * DAY),
      last_used_ip: "35.190.4.21",
    }),
    apiKey("Staging", ["read", "write"], 20 * DAY),
    apiKey("Old CI token", ["read"], 300 * DAY, { status: "revoked", revoked_at: at(90 * DAY), last_used_at: at(91 * DAY) }),
  ];

  // Files
  const file = (name: string, type: string, size: number, purpose: string, created: number, dims?: [number, number]): MockFile => {
    const fileId = id();
    return {
      id: fileId,
      name,
      size,
      content_type: type,
      checksum: r.chars(64, "0123456789abcdef"),
      width: dims?.[0] ?? null,
      height: dims?.[1] ?? null,
      purpose,
      status: "ready",
      created_at: at(created),
      download_url: "",
      _owner: ada.id,
      _bytes: new TextEncoder().encode(`Plate demo file: ${name}\n`),
    };
  };
  const files = [
    file("spring-menu.pdf", "application/pdf", 482_113, "document", 3 * HOUR),
    file("hero-plates.webp", "image/webp", 1_284_220, "image", 1 * DAY, [2400, 1600]),
    file("catalog-export.csv", "text/csv", 96_402, "export", 2 * DAY),
    file("glaze-samples.jpg", "image/jpeg", 2_310_554, "image", 5 * DAY, [2400, 1800]),
    file("supplier-contract.pdf", "application/pdf", 210_877, "document", 9 * DAY),
    file("care-guide.md", "text/plain", 4_210, "chat", 12 * DAY),
    file("logo.png", "image/png", 18_340, "image", 40 * DAY, [512, 512]),
  ];

  // Notifications: 34 for Ada, the 9 most recent unread
  const notifications: MockNotification[] = [];
  let offset = 4 * MIN;
  for (let i = 0; i < 34; i++) {
    const t = NOTIFICATIONS[i % NOTIFICATIONS.length];
    const created = offset;
    offset += r.int(20, 9 * 60) * MIN;
    const read = i >= 9 && !(i === 14 || i === 21);
    notifications.push({
      id: id(),
      kind: t.kind,
      title: t.title,
      body: t.body,
      url: t.url,
      data: {},
      read,
      read_at: read ? at(Math.max(0, created - 10 * MIN)) : null,
      created_at: at(created),
      _owner: ada.id,
    });
  }
  for (let i = 0; i < 3; i++) {
    const t = NOTIFICATIONS[(i * 5) % NOTIFICATIONS.length];
    notifications.push({ id: id(), ...t, data: {}, read: false, read_at: null, created_at: at((i + 1) * HOUR), _owner: grace.id });
  }

  // AI
  const models = [
    { id: "plate-swift", name: "Swift", description: "Quick answers for everyday tasks." },
    { id: "plate-sage", name: "Sage", description: "Careful reasoning for longer work." },
    { id: "plate-echo", name: "Echo", description: "Repeats your message, handy for testing." },
  ];
  const suggestions = [
    { id: "menu", title: "Plan a menu", description: "Five courses for a spring dinner", prompt: "Plan a five course spring tasting menu for eight guests." },
    { id: "describe", title: "Describe a product", description: "Copy for the Linen Napkin Set", prompt: "Write a short product description for our Linen Napkin Set." },
    { id: "orders", title: "Summarize orders", description: "What sold best last week", prompt: "Summarize last week's orders and what sold best." },
    { id: "reply", title: "Answer a customer", description: "A polite reply about a late delivery", prompt: "Draft a polite reply to a customer whose delivery is late." },
  ];
  const conversations: MockConversation[] = [];
  const messages: MockMessage[] = [];
  const convo = (title: string, ago: number, turns: [string, string, string?][], extra: Partial<MockConversation> = {}) => {
    const c: MockConversation = {
      id: id(),
      title,
      model: "plate-swift",
      system_prompt: "",
      pinned: false,
      archived: false,
      created_at: at(ago + turns.length * 4 * MIN),
      updated_at: at(ago),
      last_message_at: at(ago),
      _owner: ada.id,
      ...extra,
    };
    conversations.push(c);
    turns.forEach(([question, answer, reasoning], i) => {
      const t = ago + (turns.length - i) * 4 * MIN;
      const base = { conversation: c.id, error_code: "", model: c.model ?? "plate-swift", sources: [], attachments: [], variants: [], _owner: ada.id };
      messages.push({ ...base, id: id(), role: "user", content: question, reasoning: "", status: "complete", input_tokens: 0, output_tokens: 0, created_at: at(t) });
      messages.push({
        ...base,
        id: id(),
        role: "assistant",
        content: answer,
        reasoning: reasoning ?? "",
        status: "complete",
        input_tokens: question.split(" ").length * 3,
        output_tokens: answer.split(" ").length,
        created_at: at(t - 20_000),
      });
    });
  };
  convo("Plan a spring tasting menu", 25 * MIN, [
    [
      "Plan a five course spring tasting menu for eight guests.",
      "Here is a light, seasonal menu:\n\n1. Pea and mint soup with lemon oil\n2. Asparagus, burrata and toasted hazelnuts\n3. Wild garlic risotto\n4. Roast lamb with spring onions and new potatoes\n5. Rhubarb and vanilla panna cotta\n\nServe the soup in the Celadon Pasta Bowls and the main course on the Stoneware Dinner Plates.",
      "Spring produce: peas, asparagus, wild garlic, rhubarb. Five courses, light to rich, then a fresh dessert.",
    ],
    [
      "Can you make the main course vegetarian?",
      "Swap the lamb for roasted spring carrots with whipped feta, dukkah and a honey glaze. It keeps the same weight on the plate and pairs well with the risotto before it.",
    ],
  ]);
  convo("Linen Napkin Set description", 3 * HOUR, [
    [
      "Write a short product description for our Linen Napkin Set.",
      "Stonewashed European linen that gets softer with every wash. A set of four generous napkins in muted, food friendly tones, made to be used every day and passed down later.",
    ],
  ]);
  convo("Last week's orders", 1 * DAY, [
    [
      "Summarize last week's orders and what sold best.",
      "You had 214 orders, 12% more than the week before. Best sellers: Speckled Dinner Plate (61 units), Walnut Cutting Board (38) and Linen Napkin Set (35). Average order value was $74.",
    ],
  ]);
  convo("Reply about a late delivery", 2 * DAY, [
    [
      "Draft a polite reply to a customer whose delivery is late.",
      "Hi Maya, thank you for your patience. Your order left our studio on Monday and the courier now expects to deliver it by Thursday. We added free shipping to your next order to make up for the wait. Warmly, the Plate team",
    ],
  ]);
  convo("Holiday gift bundle ideas", 4 * DAY, [
    [
      "Ideas for a holiday gift bundle under $80?",
      "Three options: a Breakfast Set (2 mugs, 2 side plates), a Host Set (carafe, 4 tumblers) and a Cook Set (olive wood utensils, apron, tea towel). Each comes in under $80 with gift wrapping.",
    ],
  ], { pinned: true });
  convo("Care guide in Italian", 9 * DAY, [
    [
      "Translate the stoneware care guide to Italian.",
      "Lavare a mano o in lavastoviglie a basse temperature. Evitare sbalzi termici. Asciugare bene prima di riporre.",
    ],
  ], { archived: true });

  // Billing: Grace is on Pro, Ada on Free
  const subscriptions = [
    {
      id: id(),
      plan_id: "pro",
      price_id: "price_pro_month",
      interval: "month",
      status: "active" as const,
      active: true,
      current_period_end: new Date(now + 18 * DAY).toISOString(),
      cancel_at_period_end: false,
      trial_end: null,
      created_at: at(80 * DAY),
      updated_at: at(12 * DAY),
      _owner: grace.id,
    },
  ];

  // Activity
  const activity: MockActivity[] = [];
  const actions: [string, string, string][] = [
    ["auth.login", "", ""],
    ["auth.logout", "", ""],
    ["auth.login_failed", "", ""],
    ["apikeys.apikey.created", "apikeys.apikey", "Staging"],
    ["files.file.created", "files.file", "hero-plates.webp"],
    ["auth.password_changed", "", ""],
    ["webhooks.endpoint.updated", "webhooks.endpoint", "https://hooks.plate.dev/orders"],
    ["billing.plan_changed", "billing.subscription", "Pro"],
    ["auth.sessions_revoked", "", ""],
    ["rbac.role.assigned", "accounts.user", "Linus Okafor"],
  ];
  for (let i = 0; i < 60; i++) {
    const user = i % 3 === 0 ? r.pick(users.slice(1, 12)) : ada;
    const [action, type, repr] = r.pick(actions);
    const ua = r.pick(Object.values(USER_AGENTS));
    activity.push({
      id: id(),
      actor: user.id,
      actor_email: user.email,
      action,
      target_type: type,
      target_id: type ? id() : "",
      target_repr: repr,
      changes: action === "billing.plan_changed" ? { plan: ["free", "pro"] } : {},
      metadata: action === "auth.login_failed" ? { email: user.email } : {},
      ip: r.pick(["203.0.113.24", "198.51.100.7", "192.0.2.144"]),
      user_agent: ua,
      request_id: r.chars(16, "0123456789abcdef"),
      created_at: at(i * 7 * HOUR + r.int(1, 300) * MIN),
    });
  }

  // Webhooks
  const webhookEvents = [
    { name: "ping", description: "Sent by the test button." },
    { name: "user.created", description: "A user signed up." },
    { name: "user.deleted", description: "A user deleted their account." },
    { name: "order.created", description: "A customer placed an order." },
    { name: "order.paid", description: "An order was paid." },
    { name: "product.low_stock", description: "A product fell under 10 units." },
  ];
  const endpoint = (url: string, description: string, events: string[], created: number, extra: Partial<MockEndpoint> = {}): MockEndpoint => ({
    id: id(),
    url,
    description,
    events,
    active: true,
    consecutive_failures: 0,
    disabled_at: null,
    created_at: at(created),
    _owner: ada.id,
    _secret: `whsec_${r.chars(43, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_")}`,
    ...extra,
  });
  const endpoints = [
    endpoint("https://hooks.plate.dev/orders", "Order sync", ["order.created", "order.paid"], 60 * DAY),
    endpoint("https://example.com/plate/webhooks", "Everything, for the data team", ["*"], 30 * DAY),
    endpoint("https://legacy.plate.dev/hooks", "Old inventory service", ["product.low_stock"], 200 * DAY, {
      active: false,
      consecutive_failures: 20,
      disabled_at: at(14 * DAY),
    }),
  ];
  const deliveries: MockDelivery[] = [];
  for (const ep of endpoints) {
    for (let i = 0; i < 14; i++) {
      const failed = ep.active ? r.bool(0.15) : true;
      const event = (ep.events ?? []).includes("*") ? r.pick(webhookEvents.slice(1)).name : r.pick(ep.events ?? ["ping"]);
      const created = i * 5 * HOUR + r.int(1, 200) * MIN;
      const code = failed ? r.pick([500, 502, 404, null]) : 200;
      deliveries.push({
        id: id(),
        endpoint: ep.id,
        event_id: `evt_${r.chars(20)}`,
        event,
        status: failed ? "failed" : "success",
        attempts: failed ? r.int(1, 6) : 1,
        next_attempt_at: failed && ep.active ? new Date(now + 30 * MIN).toISOString() : null,
        last_status_code: code,
        last_error: failed ? (code === null ? "Connection timed out." : `HTTP ${code}`) : "",
        duration_ms: code === null ? null : r.int(40, 900),
        created_at: at(created),
        delivered_at: failed ? null : at(created - 2000),
        payload: { id: `evt_${r.chars(12)}`, type: event, data: { order: 1000 + i, total: r.int(20, 300) } },
        response_excerpt: failed ? "Internal Server Error" : "{\"ok\":true}",
        _owner: ada.id,
      });
    }
  }

  // RBAC
  const perm = (codename: string, name: string) => {
    const [app_label, code] = codename.split(".");
    return { id: id(), codename, name, app_label, model: code.split("_").slice(1).join("_") };
  };
  const permissions = [
    perm("pleate_accounts.view_user", "Can view user"),
    perm("pleate_accounts.change_user", "Can change user"),
    perm("pleate_accounts.delete_user", "Can delete user"),
    perm("pleate_staff.view_ban", "Can view ban"),
    perm("pleate_staff.add_ban", "Can add ban"),
    perm("pleate_staff.delete_ban", "Can delete ban"),
    perm("pleate_rbac.view_feature", "Can view feature"),
    perm("pleate_rbac.change_feature", "Can change feature"),
    perm("catalog.view_product", "Can view product"),
    perm("catalog.change_product", "Can change product"),
    perm("auth.change_group", "Can change group"),
  ];
  const roles = [
    { id: id(), name: "admin", description: "Full access to the back office.", is_default: false, permissions: permissions.map((p) => p.codename) },
    { id: id(), name: "editor", description: "Edits the catalog.", is_default: false, permissions: ["catalog.view_product", "catalog.change_product"] },
    { id: id(), name: "viewer", description: "Read only access.", is_default: true, permissions: ["catalog.view_product"] },
  ];
  const features = [
    { id: id(), key: "new-dashboard", description: "The redesigned dashboard.", enabled: true, rollout_percent: 0, users: [], groups: [], created_at: at(50 * DAY), updated_at: at(5 * DAY) },
    { id: id(), key: "ai-chat", description: "The AI assistant.", enabled: false, rollout_percent: 0, users: [], groups: ["admin", "editor"], created_at: at(40 * DAY), updated_at: at(10 * DAY) },
    { id: id(), key: "bulk-import", description: "CSV import of products.", enabled: false, rollout_percent: 25, users: [], groups: [], created_at: at(20 * DAY), updated_at: at(2 * DAY) },
    { id: id(), key: "gift-cards", description: "Sell gift cards.", enabled: false, rollout_percent: 0, users: [], groups: [], created_at: at(3 * DAY), updated_at: at(3 * DAY) },
  ];
  const bans = [
    { id: id(), network: "192.0.2.66", reason: "Credential stuffing", expires_at: null, is_active: true, created_by: ada.id, created_at: at(20 * DAY) },
    { id: id(), network: "198.51.100.0/24", reason: "Scraping the catalog", expires_at: new Date(now + 10 * DAY).toISOString(), is_active: true, created_by: ada.id, created_at: at(4 * DAY) },
  ];

  // Products
  const products: MockProduct[] = [];
  const names = new Set<string>();
  const categories = Object.keys(CATALOG);
  while (products.length < 120) {
    const category = r.pick(categories);
    const name = `${r.pick(MATERIALS[category])} ${r.pick(CATALOG[category])}`;
    if (names.has(name)) continue;
    names.add(name);
    const created = r.int(1, 400) * DAY + r.int(0, 1439) * MIN;
    const roll = r.next();
    const stock = roll < 0.12 ? r.int(0, 9) : r.int(10, 260);
    products.push({
      id: id(),
      name,
      sku: `PL-${category.slice(0, 3).toUpperCase()}-${String(1001 + products.length)}`,
      category,
      price: Math.round(r.int(8, 240) * 100 + r.pick([0, 0, 50, 90, 95])) / 100,
      stock,
      status: r.next() < 0.75 ? "active" : r.bool(0.6) ? "draft" : "archived",
      created_at: at(created),
      updated_at: at(Math.max(MIN, created - r.int(0, Math.floor(created / DAY)) * DAY)),
    });
  }

  return {
    users,
    sessions,
    apiKeys,
    files,
    notifications,
    notificationPrefs: { [ada.id]: { "*": ["in_app"], "billing.payment_failed": ["in_app", "email"] } },
    pushSubscriptions: [],
    conversations,
    messages,
    aiUsage: { [ada.id]: { input_tokens: 1840, output_tokens: 5230 } },
    models,
    defaultModel: "plate-swift",
    suggestions,
    plans: PLANS,
    subscriptions,
    activity,
    webhookEvents,
    endpoints,
    deliveries,
    socialAccounts: [
      { id: id(), provider: "github", email: DEMO_EMAIL, created_at: at(200 * DAY), last_login_at: at(9 * DAY), _owner: ada.id },
    ],
    roles,
    permissions,
    features,
    bans,
    products,
    waitlist: [
      { id: id(), email: "early@plate.dev", referral_code: "PLATE1", referred_by: null, created_at: at(30 * DAY), invited_at: null },
      { id: id(), email: "second@plate.dev", referral_code: "PLATE2", referred_by: null, created_at: at(20 * DAY), invited_at: null },
    ],
    subscribers: [],
    contactMessages: [],
  };
}
