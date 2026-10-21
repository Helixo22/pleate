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
  { title: "Overlay", items: [c("Modal"), c("Bottom Sheet"), c("Action Sheet"), c("Popover"), c("Tooltip"), c("Toast"), c("Alert")] },
  { title: "Feedback", items: [c("Skeleton"), c("Progress"), c("Empty State")] },
  { title: "Data", items: [c("Table"), c("List"), c("Accordion"), c("Timeline"), c("Stat Card")] },
  { title: "Forms", items: [c("Form Field"), c("Date Picker"), c("Search Bar"), c("File Upload")] },
  { title: "AI", items: [c("Bot Face"), c("Chat"), c("Composer"), c("Prompt Suggestions"), c("Model Picker"), c("Reasoning")] },
  { title: "Effects", items: [c("Animated Text"), c("Reveal"), c("Page Transition"), c("Hover Effects")] },
  { title: "Marketing", items: [c("Hero"), c("Feature Grid"), c("Pricing"), c("Testimonial"), c("CTA")] },
];

export const READY_COMPONENTS = NAV.flatMap((section) => section.items).filter(
  (item) => item.ready && item.href.startsWith("/components/"),
);
