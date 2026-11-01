// Composer data model: the section schemas (fields + defaults), the library presets, the project shape and the
// sanitizer for anything read from storage or an imported file. Pure TS, no React, so node can test it directly.

export type Option = { value: string; label: string };

export type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "url" | "demo"; hint?: string }
  | { key: string; label: string; kind: "select"; options: Option[] }
  | { key: string; label: string; kind: "switch" }
  | { key: string; label: string; kind: "number"; min?: number; max?: number; step?: number }
  | { key: string; label: string; kind: "items"; itemLabel: string; titleKey: string; fields: Field[]; template: Props };

// Section props are plain JSON: strings, numbers, booleans and lists of flat records.
export type Props = Record<string, any>;

export type SectionType =
  | "navbar"
  | "hero"
  | "logos"
  | "features"
  | "stats"
  | "pricing"
  | "testimonials"
  | "cta"
  | "contact"
  | "faq"
  | "footer"
  | "rotating"
  | "statement"
  | "globe"
  | "component";

export type Block = { id: string; type: SectionType; props: Props };
export type Page = { id: string; name: string; blocks: Block[] };
export type ThemeMode = "light" | "dark";
export type SiteTheme = { palette: string; custom: string; mode: ThemeMode; roundness: number };
export type Project = { version: 1; name: string; theme: SiteTheme; pages: Page[] };

const opts = (...values: string[]): Option[] => values.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

export const ICONS = ["sparkles", "zap", "shield", "globe", "lock", "heart", "chart", "layers", "clock", "users"] as const;

const header: Field[] = [
  { key: "eyebrow", label: "Eyebrow", kind: "text" },
  { key: "title", label: "Title", kind: "text" },
  { key: "description", label: "Description", kind: "textarea" },
];
const align: Field = { key: "align", label: "Alignment", kind: "select", options: opts("start", "center") };
const tone: Field = { key: "tone", label: "Background", kind: "select", options: opts("default", "surface", "dark") };

export type SectionDef = { type: SectionType; name: string; fields: Field[]; defaults: Props };

export const SECTIONS: Record<SectionType, SectionDef> = {
  navbar: {
    type: "navbar",
    name: "Navbar",
    fields: [
      { key: "brand", label: "Brand", kind: "text" },
      { key: "links", label: "Links", kind: "items", itemLabel: "Link", titleKey: "label", fields: [{ key: "label", label: "Label", kind: "text" }], template: { label: "Link" } },
      { key: "showCta", label: "Show button", kind: "switch" },
      { key: "cta", label: "Button label", kind: "text" },
    ],
    defaults: { brand: "Northwind", links: [{ label: "Product" }, { label: "Pricing" }, { label: "Customers" }, { label: "Docs" }], showCta: true, cta: "Get started" },
  },
  hero: {
    type: "hero",
    name: "Hero",
    fields: [
      { key: "layout", label: "Layout", kind: "select", options: opts("center", "split") },
      { key: "background", label: "Background", kind: "select", options: opts("plain", "wash", "dark") },
      { key: "size", label: "Size", kind: "select", options: [{ value: "md", label: "Medium" }, { value: "lg", label: "Large" }] },
      ...header,
      { key: "primary", label: "Primary button", kind: "text" },
      { key: "secondary", label: "Secondary button", kind: "text", hint: "Leave empty to hide" },
      { key: "footnote", label: "Footnote", kind: "text" },
      { key: "image", label: "Image URL", kind: "url", hint: "Shown beside the text in the split layout" },
    ],
    defaults: {
      layout: "center",
      background: "wash",
      size: "lg",
      eyebrow: "New: shared workspaces",
      title: "Ship the site your team keeps asking for",
      description: "Pages, pricing and docs from one set of parts that look native on every screen.",
      primary: "Start free",
      secondary: "Book a demo",
      footnote: "No card needed. Cancel any time.",
      image: "",
    },
  },
  logos: {
    type: "logos",
    name: "Logo marquee",
    fields: [
      { key: "caption", label: "Caption", kind: "text" },
      { key: "items", label: "Logos", kind: "items", itemLabel: "Logo", titleKey: "name", fields: [{ key: "name", label: "Name", kind: "text" }], template: { name: "Company" } },
      { key: "duration", label: "Loop seconds", kind: "number", min: 5, max: 120, step: 5 },
      { key: "reverse", label: "Reverse direction", kind: "switch" },
    ],
    defaults: {
      caption: "Used by product teams at",
      items: ["Atlas", "Kestrel", "Fjord", "Lumen", "Orbit", "Halcyon", "Meridian"].map((name) => ({ name })),
      duration: 30,
      reverse: false,
    },
  },
  features: {
    type: "features",
    name: "Feature grid",
    fields: [
      ...header,
      align,
      tone,
      { key: "variant", label: "Style", kind: "select", options: opts("cards", "plain", "bento") },
      { key: "columns", label: "Columns", kind: "select", options: opts("2", "3", "4") },
      {
        key: "items",
        label: "Features",
        kind: "items",
        itemLabel: "Feature",
        titleKey: "title",
        fields: [
          { key: "icon", label: "Icon", kind: "select", options: opts(...ICONS) },
          { key: "title", label: "Title", kind: "text" },
          { key: "description", label: "Description", kind: "textarea" },
        ],
        template: { icon: "sparkles", title: "New feature", description: "One sentence about what it does." },
      },
    ],
    defaults: {
      eyebrow: "Features",
      title: "Everything in one place",
      description: "Less glue code, more product.",
      align: "center",
      tone: "default",
      variant: "cards",
      columns: "3",
      items: [
        { icon: "zap", title: "Fast by default", description: "Server rendered pages with zero layout shift." },
        { icon: "shield", title: "Private", description: "Your data stays in your region." },
        { icon: "users", title: "Built for teams", description: "Roles, invites and audit logs included." },
        { icon: "chart", title: "Clear numbers", description: "Usage and revenue in one dashboard." },
        { icon: "globe", title: "Global", description: "Every currency and 30 languages." },
        { icon: "clock", title: "Always on", description: "99.99% uptime over the last year." },
      ],
    },
  },
  stats: {
    type: "stats",
    name: "Stats",
    fields: [
      { key: "title", label: "Title", kind: "text", hint: "Optional" },
      tone,
      {
        key: "items",
        label: "Numbers",
        kind: "items",
        itemLabel: "Number",
        titleKey: "label",
        fields: [
          { key: "value", label: "Value", kind: "number" },
          { key: "prefix", label: "Prefix", kind: "text" },
          { key: "suffix", label: "Suffix", kind: "text" },
          { key: "label", label: "Label", kind: "text" },
        ],
        template: { value: 100, prefix: "", suffix: "", label: "Label" },
      },
    ],
    defaults: {
      title: "",
      tone: "surface",
      items: [
        { value: 12000, prefix: "", suffix: "+", label: "teams" },
        { value: 99, prefix: "", suffix: "%", label: "uptime" },
        { value: 40, prefix: "", suffix: " ms", label: "median response" },
      ],
    },
  },
  pricing: {
    type: "pricing",
    name: "Pricing",
    fields: [
      ...header,
      tone,
      { key: "currency", label: "Currency", kind: "select", options: [{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }] },
      { key: "showToggle", label: "Monthly / yearly switch", kind: "switch" },
      {
        key: "items",
        label: "Plans",
        kind: "items",
        itemLabel: "Plan",
        titleKey: "name",
        fields: [
          { key: "name", label: "Name", kind: "text" },
          { key: "description", label: "Description", kind: "text" },
          { key: "monthly", label: "Monthly price", kind: "number", min: 0 },
          { key: "yearly", label: "Yearly price, per month", kind: "number", min: 0 },
          { key: "features", label: "Features", kind: "textarea", hint: "One per line" },
          { key: "cta", label: "Button label", kind: "text" },
          { key: "highlighted", label: "Highlight", kind: "switch" },
        ],
        template: { name: "Plan", description: "", monthly: 10, yearly: 8, features: "Feature", cta: "Choose", highlighted: false },
      },
    ],
    defaults: {
      eyebrow: "Pricing",
      title: "Simple plans",
      description: "Start free, upgrade when the team grows.",
      tone: "surface",
      currency: "USD",
      showToggle: true,
      items: [
        { name: "Starter", description: "For side projects.", monthly: 0, yearly: 0, features: "1 project\nCommunity support", cta: "Start free", highlighted: false },
        { name: "Team", description: "For growing teams.", monthly: 24, yearly: 19, features: "Unlimited projects\nRoles and invites\nPriority support", cta: "Try 14 days", highlighted: true },
        { name: "Scale", description: "For larger orgs.", monthly: 79, yearly: 64, features: "SSO\nAudit logs\nDedicated support", cta: "Contact sales", highlighted: false },
      ],
    },
  },
  testimonials: {
    type: "testimonials",
    name: "Testimonials",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "layout", label: "Layout", kind: "select", options: opts("grid", "carousel", "featured") },
      {
        key: "items",
        label: "Quotes",
        kind: "items",
        itemLabel: "Quote",
        titleKey: "name",
        fields: [
          { key: "quote", label: "Quote", kind: "textarea" },
          { key: "name", label: "Name", kind: "text" },
          { key: "role", label: "Role", kind: "text" },
          { key: "rating", label: "Rating", kind: "number", min: 0, max: 5 },
        ],
        template: { quote: "A short quote.", name: "Name Surname", role: "Role", rating: 5 },
      },
    ],
    defaults: {
      eyebrow: "Customers",
      title: "Teams that switched",
      layout: "grid",
      items: [
        { quote: "We rebuilt our marketing site in a week and it finally matches the app.", name: "Sofia Rossi", role: "Design lead, Kestrel", rating: 5 },
        { quote: "Dark mode, palettes and forms worked on day one. Our designers stopped filing tickets.", name: "Omar Haddad", role: "CTO, Fjord", rating: 5 },
        { quote: "The pricing page alone saved us a sprint.", name: "Aiko Tanaka", role: "Founder, Lumen", rating: 4 },
      ],
    },
  },
  cta: {
    type: "cta",
    name: "Call to action",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "button", label: "Button label", kind: "text" },
      { key: "tone", label: "Tone", kind: "select", options: opts("accent", "surface", "dark") },
      align,
    ],
    defaults: { title: "Ready when you are", description: "Create a workspace in a minute and invite the team later.", button: "Get started", tone: "accent", align: "center" },
  },
  contact: {
    type: "contact",
    name: "Contact form",
    fields: [...header, align, { key: "showSubject", label: "Subject field", kind: "switch" }, { key: "footnote", label: "Footnote", kind: "text" }],
    defaults: {
      eyebrow: "Contact",
      title: "Talk to us",
      description: "We answer within one working day.",
      align: "center",
      showSubject: true,
      footnote: "We only use your email to reply.",
    },
  },
  faq: {
    type: "faq",
    name: "FAQ",
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      align,
      { key: "variant", label: "Style", kind: "select", options: opts("inset", "separated", "plain") },
      {
        key: "items",
        label: "Questions",
        kind: "items",
        itemLabel: "Question",
        titleKey: "q",
        fields: [
          { key: "q", label: "Question", kind: "text" },
          { key: "a", label: "Answer", kind: "textarea" },
        ],
        template: { q: "A question?", a: "The answer." },
      },
    ],
    defaults: {
      eyebrow: "FAQ",
      title: "Questions, answered",
      align: "center",
      variant: "separated",
      items: [
        { q: "Is there a free plan?", a: "Yes. Starter is free for one project, forever." },
        { q: "Can I cancel any time?", a: "Plans are monthly or yearly and you can cancel from settings." },
        { q: "Where is my data stored?", a: "In the EU or the US, you choose when you create the workspace." },
      ],
    },
  },
  footer: {
    type: "footer",
    name: "Footer",
    fields: [
      { key: "brand", label: "Brand", kind: "text" },
      { key: "tagline", label: "Tagline", kind: "text" },
      {
        key: "columns",
        label: "Columns",
        kind: "items",
        itemLabel: "Column",
        titleKey: "title",
        fields: [
          { key: "title", label: "Title", kind: "text" },
          { key: "links", label: "Links", kind: "textarea", hint: "One per line" },
        ],
        template: { title: "Column", links: "Link" },
      },
      { key: "copyright", label: "Copyright", kind: "text" },
    ],
    defaults: {
      brand: "Northwind",
      tagline: "Websites for teams that ship.",
      columns: [
        { title: "Product", links: "Features\nPricing\nChangelog" },
        { title: "Company", links: "About\nCareers\nContact" },
        { title: "Legal", links: "Privacy\nTerms" },
      ],
      copyright: "© 2026 Northwind",
    },
  },
  rotating: {
    type: "rotating",
    name: "Rotating headline",
    fields: [
      { key: "before", label: "Text before", kind: "text" },
      { key: "words", label: "Rotating words", kind: "textarea", hint: "One per line" },
      { key: "after", label: "Text after", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "button", label: "Button label", kind: "text" },
      tone,
    ],
    defaults: { before: "Built for", words: "founders\ndesigners\nengineers", after: "", description: "One toolkit, every screen size.", button: "Start building", tone: "default" },
  },
  statement: {
    type: "statement",
    name: "Statement",
    fields: [
      { key: "text", label: "Text", kind: "textarea" },
      { key: "effect", label: "Effect", kind: "select", options: opts("gradient", "shiny", "blur") },
      align,
      tone,
    ],
    defaults: { text: "Good software feels calm. Every part of this page was picked to stay out of the way.", effect: "blur", align: "center", tone: "default" },
  },
  globe: {
    type: "globe",
    name: "Globe",
    fields: [...header, { key: "button", label: "Button label", kind: "text" }, { key: "speed", label: "Spin speed", kind: "number", min: 0, max: 40 }, tone],
    defaults: {
      eyebrow: "Everywhere",
      title: "Served close to every customer",
      description: "Thirty regions, one dashboard. Pages load from the nearest edge.",
      button: "See regions",
      speed: 8,
      tone: "dark",
    },
  },
  // Any docs component dropped from the Components tab: renders one of its demos, or, for the Backgrounds set, the
  // effect itself behind a headline. `slug` and `demo` are checked against the catalog on load.
  component: {
    type: "component",
    name: "Component",
    fields: [
      { key: "slug", label: "Component", kind: "text" },
      { key: "demo", label: "Example", kind: "demo" },
      { key: "asBackground", label: "Use as section background", kind: "switch" },
      { key: "height", label: "Height in px", kind: "number", min: 240, max: 1200, step: 20 },
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "heading", label: "Heading", kind: "text", hint: "Optional" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "primary", label: "Primary button", kind: "text" },
      { key: "secondary", label: "Secondary button", kind: "text" },
      { key: "width", label: "Width", kind: "select", options: opts("full", "wide", "narrow") },
      { key: "padding", label: "Padding", kind: "select", options: [{ value: "none", label: "None" }, { value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] },
      {
        key: "background",
        label: "Background",
        kind: "select",
        options: [{ value: "none", label: "None" }, { value: "surface", label: "Surface" }, { value: "bg", label: "Page" }, { value: "accent", label: "Accent, soft" }],
      },
      align,
    ],
    defaults: {
      slug: "",
      demo: "",
      asBackground: false,
      height: 560,
      eyebrow: "",
      heading: "",
      description: "",
      primary: "",
      secondary: "",
      width: "wide",
      padding: "md",
      background: "none",
      align: "center",
    },
  },
};

/** Fields the panel shows for a component block: background mode swaps layout options for headline and buttons. */
export function componentFields(p: Props, canBackground: boolean): Field[] {
  const hidden = new Set(["slug", ...(canBackground ? [] : ["asBackground"])]);
  for (const k of p.asBackground && canBackground ? ["demo", "width", "padding", "background", "align"] : ["height", "primary", "secondary"]) hidden.add(k);
  return SECTIONS.component.fields.filter((f) => !hidden.has(f.key));
}

export function componentBlock(slug: string, demo: string, background: boolean): Block {
  return createBlock({
    type: "component",
    props: background
      ? { slug, demo, asBackground: true, heading: "Your headline here", description: "Edit this text in the panel on the right.", primary: "Get started", secondary: "Learn more" }
      : { slug, demo },
  });
}

export type LibraryItem = { id: string; group: string; name: string; description: string; type: SectionType; props?: Props };

// The left panel: several presets can share one section type (two hero variants, a dark CTA...).
export const LIBRARY: LibraryItem[] = [
  { id: "navbar", group: "Navigation", name: "Navbar", description: "Brand, links and a button", type: "navbar" },
  { id: "footer", group: "Navigation", name: "Footer", description: "Brand and link columns", type: "footer" },
  { id: "hero-center", group: "Heroes", name: "Hero, centered", description: "Headline over a soft wash", type: "hero" },
  {
    id: "hero-split",
    group: "Heroes",
    name: "Hero, split",
    description: "Text beside an image",
    type: "hero",
    props: { layout: "split", background: "plain", size: "md", image: "" },
  },
  { id: "hero-dark", group: "Heroes", name: "Hero, dark", description: "Centered on a dark band", type: "hero", props: { background: "dark" } },
  { id: "logos", group: "Content", name: "Logo marquee", description: "A looping row of names", type: "logos" },
  { id: "features", group: "Content", name: "Feature grid", description: "Icon cards in a grid", type: "features" },
  { id: "features-bento", group: "Content", name: "Bento grid", description: "Features in mixed sizes", type: "features", props: { variant: "bento", columns: "3" } },
  { id: "stats", group: "Content", name: "Stats", description: "Numbers that count up", type: "stats" },
  { id: "testimonials", group: "Content", name: "Testimonials", description: "Quotes from customers", type: "testimonials" },
  { id: "faq", group: "Content", name: "FAQ", description: "Questions in an accordion", type: "faq" },
  { id: "pricing", group: "Conversion", name: "Pricing", description: "Plans with a billing switch", type: "pricing" },
  { id: "cta", group: "Conversion", name: "Call to action", description: "One line and one button", type: "cta" },
  { id: "contact", group: "Conversion", name: "Contact form", description: "Name, email and message", type: "contact" },
  { id: "rotating", group: "Effects", name: "Rotating headline", description: "Words that take turns", type: "rotating" },
  { id: "statement", group: "Effects", name: "Statement", description: "Large text with a reveal", type: "statement" },
  { id: "globe", group: "Effects", name: "Globe", description: "A dot globe you can drag", type: "globe" },
];

export const PALETTE_NAMES = ["blue", "cobalt", "violet", "indigo", "ocean", "teal", "green", "amber", "orange", "rose", "graphite"];

let counter = 0;
export const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export function createBlock(item: Pick<LibraryItem, "type" | "props">): Block {
  return { id: uid(), type: item.type, props: { ...clone(SECTIONS[item.type].defaults), ...clone(item.props ?? {}) } };
}

export function defaultProject(): Project {
  const start = ["navbar", "hero-center", "logos", "features", "cta", "footer"].map((id) => createBlock(LIBRARY.find((l) => l.id === id)!));
  return {
    version: 1,
    name: "My site",
    theme: { palette: "blue", custom: "#ff2d55", mode: "dark", roundness: 1.5 },
    pages: [{ id: uid(), name: "Home", blocks: start }],
  };
}

/** "About us" -> "about-us"; the first page is the site root. */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "page";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback: string, max = 2000) => (typeof v === "string" ? v.slice(0, max) : fallback);
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

// Keeps only the keys a field declares, coerced to the field's kind; anything else falls back to the default.
function cleanValue(field: Field, value: unknown, fallback: unknown): unknown {
  switch (field.kind) {
    case "switch":
      return typeof value === "boolean" ? value : fallback;
    case "number":
      return num(value, fallback as number);
    case "select":
      return field.options.some((o) => o.value === value) ? value : fallback;
    case "items":
      if (!Array.isArray(value)) return fallback;
      return value.slice(0, 50).filter(isObj).map((item) => cleanProps(field.fields, item, field.template));
    default:
      return str(value, fallback as string);
  }
}

function cleanProps(fields: Field[], props: Record<string, unknown>, defaults: Props): Props {
  return Object.fromEntries(fields.map((f) => [f.key, cleanValue(f, props[f.key], clone(defaults[f.key]))]));
}

/** slug -> demo ids, from the docs registry. */
export type ComponentIndex = Record<string, string[]>;
const SLUG = /^[a-z0-9-]{1,64}$/;

/** A component block survives only with a known slug (or a well formed one when no index is given). */
function cleanComponent(block: Block, components?: ComponentIndex): Block | null {
  const { slug, demo } = block.props;
  if (!SLUG.test(slug)) return null;
  if (!components) return SLUG.test(demo) ? block : null;
  const demos = components[slug];
  if (!demos?.length) return null;
  return demos.includes(demo) ? block : { ...block, props: { ...block.props, demo: demos[0] } };
}

/** Validates untrusted JSON (localStorage, imported file). Returns null when it is not a composer project at all. */
export function sanitizeProject(input: unknown, components?: ComponentIndex): Project | null {
  if (!isObj(input) || !Array.isArray(input.pages)) return null;
  const t = isObj(input.theme) ? input.theme : {};
  const pages = input.pages.filter(isObj).slice(0, 50).map((p) => ({
    id: str(p.id, uid(), 64) || uid(),
    name: str(p.name, "Page", 60) || "Page",
    blocks: (Array.isArray(p.blocks) ? p.blocks : [])
      .filter((b): b is Record<string, unknown> => isObj(b) && typeof b.type === "string" && b.type in SECTIONS)
      .slice(0, 100)
      .map((b) => {
        const def = SECTIONS[b.type as SectionType];
        const block = { id: str(b.id, "", 64) || uid(), type: def.type, props: cleanProps(def.fields, isObj(b.props) ? b.props : {}, def.defaults) };
        return def.type === "component" ? cleanComponent(block, components) : block;
      })
      .filter((b): b is Block => b !== null),
  }));
  if (pages.length === 0) return null;
  const palette = t.palette === "custom" || PALETTE_NAMES.includes(t.palette as string) ? (t.palette as string) : "blue";
  const custom = typeof t.custom === "string" && /^#[0-9a-f]{6}$/i.test(t.custom) ? t.custom : "#ff2d55";
  return {
    version: 1,
    name: str(input.name, "My site", 80),
    theme: { palette, custom, mode: t.mode === "light" ? "light" : "dark", roundness: Math.min(3, Math.max(0, num(t.roundness, 1.5))) },
    pages,
  };
}

/** One docs component as the Components tab lists it (built on the server from the docs registry and nav). */
export type CatalogItem = {
  slug: string;
  name: string;
  section: string;
  description: string;
  demos: { id: string; title: string }[];
  /** Backgrounds only: the effect to place behind a section. */
  background?: { name: string; path: string };
};
