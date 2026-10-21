// Docs navigation: every category of the plan, with the components already built marked ready.

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
  { title: "Feedback", items: [c("Skeleton", true), c("Progress", true), c("Empty State", true)] },
  { title: "Data", items: [c("Table", true), c("List", true), c("Accordion", true), c("Timeline", true), c("Stat Card", true)] },
  { title: "Forms", items: [c("Form Field", true), c("Date Picker", true), c("Search Bar", true), c("File Upload", true)] },
  {
    title: "AI",
    items: [
      c("Bot Face", true), c("Chat", true), c("Composer", true), c("Streaming Text", true), c("Prompt Suggestions", true),
      c("Result Card", true), c("Model Picker", true), c("Reasoning", true),
    ],
  },
  { title: "Effects", items: [c("Animated Text", true), c("Reveal", true), c("Page Transition", true), c("Hover Effects", true)] },
  { title: "Marketing", items: [c("Hero"), c("Feature Grid"), c("Pricing"), c("Testimonial"), c("CTA")] },
];

export const READY_COMPONENTS = NAV.flatMap((section) => section.items).filter(
  (item) => item.ready && item.href.startsWith("/components/"),
);
