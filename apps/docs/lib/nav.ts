// Docs navigation: every category of the plan, with the components already built marked ready.
import { BACKEND_PAGES } from "./backend-pages";

export type NavItem = { name: string; href: string; ready: boolean };
export type NavSection = { title: string; items: NavItem[] };

const c = (name: string, ready = false): NavItem => ({
  name,
  href: `/components/${name.toLowerCase().replace(/\s+/g, "-")}`,
  ready,
});

export const NAV: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { name: "Overview", href: "/", ready: true },
      { name: "Tokens", href: "/tokens", ready: true },
      { name: "Theming", href: "/theming", ready: true },
    ],
  },
  {
    title: "Base",
    items: [
      c("Button", true), c("Icon Button", true), c("Input", true), c("Textarea", true), c("Select", true),
      c("Checkbox", true), c("Radio", true), c("Switch", true), c("Slider", true), c("Badge", true),
      c("Avatar", true), c("Tag", true), c("Label", true), c("Spinner", true),
    ],
  },
  {
    title: "Layout",
    items: [
      c("Container", true), c("Stack", true), c("Grid", true), c("Card", true), c("Divider", true), c("Section", true),
      c("Navbar", true), c("Navigation Bar", true), c("Sidebar", true), c("Footer", true), c("Tab Bar", true),
    ],
  },
  {
    title: "Navigation",
    items: [c("Tabs", true), c("Segmented Control", true), c("Breadcrumb", true), c("Pagination", true), c("Menu", true), c("Dropdown", true)],
  },
  {
    title: "Overlay",
    items: [
      c("Modal", true), c("Bottom Sheet", true), c("Action Sheet", true), c("Alert Dialog", true), c("Popover", true),
      c("Tooltip", true), c("Toast", true), c("Alert", true),
    ],
  },
  { title: "Feedback", items: [c("Skeleton", true), c("Progress", true), c("Empty State", true), c("Notification Center", true)] },
  { title: "Data", items: [c("Table", true), c("List", true), c("Accordion", true), c("Timeline", true), c("Stat Card", true), c("Data Table", true), c("Session List", true), { name: "API Key List", href: "/components/api-key-list", ready: true }] },
  { title: "Forms", items: [c("Form Field", true), c("Date Picker", true), c("Search Bar", true), c("File Upload", true), c("Password Input", true), c("OTP Input", true)] },
  {
    title: "Auth",
    items: [
      c("Auth Card", true), c("Login Form", true), c("Signup Form", true), c("Forgot Password Form", true), c("Reset Password Form", true),
      c("Two Factor Form", true), c("Two Factor Setup", true), { name: "OAuth Buttons", href: "/components/oauth-buttons", ready: true },
    ],
  },
  {
    title: "AI",
    items: [
      c("Bot Face", true), c("Chat", true), c("Composer", true), c("Streaming Text", true), c("Prompt Suggestions", true),
      c("Result Card", true), c("Model Picker", true), c("Reasoning", true),
    ],
  },
  { title: "Effects", items: [c("Animated Text", true), c("Reveal", true), c("Page Transition", true), c("Hover Effects", true)] },
  { title: "Marketing", items: [c("Hero", true), c("Feature Grid", true), c("Pricing", true), c("Testimonial", true), c("CTA", true), { name: "Contact Form", href: "/components/contact", ready: true }, c("Logo Marquee", true)] },
  { title: "Examples", items: [{ name: "Landing page", href: "/examples/landing", ready: true }] },
];

export const READY_COMPONENTS = NAV.flatMap((section) => section.items).filter(
  (item) => item.ready && item.href.startsWith("/components/"),
);

// The Backend docs are a separate area of the site (header toggle), with their own sidebar.
const BACKEND_GROUPS: { title: string; slugs: string[] }[] = [
  { title: "Getting started", slugs: ["overview", "installation", "conventions", "client-and-hooks"] },
  { title: "Accounts", slugs: ["authentication", "two-factor", "oauth", "roles-and-permissions", "api-keys"] },
  { title: "Data", slugs: ["lists-and-tables", "files", "notifications", "emails", "activity-log"] },
  { title: "Platform", slugs: ["rate-limiting-and-cache", "background-tasks", "webhooks", "internationalization"] },
  { title: "Product", slugs: ["ai-chat", "marketing", "billing", "staff"] },
  { title: "Operations", slugs: ["testing", "deployment"] },
];

const backendItem = (slug: string): NavItem | null => {
  const page = BACKEND_PAGES.find((p) => p.slug === slug);
  return page ? { name: page.name, href: `/backend/${page.slug}`, ready: true } : null;
};

const grouped = new Set(BACKEND_GROUPS.flatMap((g) => g.slugs));
const ungrouped = BACKEND_PAGES.filter((p) => !grouped.has(p.slug)).map((p) => p.slug);

export const BACKEND_NAV: NavSection[] = [
  ...BACKEND_GROUPS,
  ...(ungrouped.length ? [{ title: "More", slugs: ungrouped }] : []),
].map((group) => ({
  title: group.title,
  items: group.slugs.map(backendItem).filter((item): item is NavItem => item !== null),
}));

export type Area = "frontend" | "backend";

export const areaOf = (pathname: string): Area => (pathname.startsWith("/backend") ? "backend" : "frontend");

export const AREA_HOME: Record<Area, string> = { frontend: "/", backend: "/backend/overview" };
