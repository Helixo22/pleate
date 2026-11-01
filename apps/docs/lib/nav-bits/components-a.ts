// Sidebar entries for the React Bits inspired set (components-a). Merged into NAV in lib/nav.ts.
import type { NavItem } from "../nav";

const item = (name: string, slug: string): NavItem => ({ name, href: `/components/${slug}`, ready: true });

export const NAV_COMPONENTS_A: NavItem[] = [
  item("Accordion Gallery", "accordion-gallery"),
  item("Animated List", "animated-list"),
  item("Border Glow", "border-glow"),
  item("Bounce Cards", "bounce-cards"),
  item("Bubble Menu", "bubble-menu"),
  item("Card Nav", "card-nav"),
  item("Card Swap", "card-swap"),
  item("Chroma Grid", "chroma-grid"),
  item("Circular Carousel", "circular-carousel"),
  item("Circular Gallery", "circular-gallery"),
  item("Counter", "counter"),
  item("Curved Input", "curved-input"),
  item("Decay Card", "decay-card"),
  item("Depth Carousel", "depth-carousel"),
  item("Dock", "dock"),
  item("Dome Gallery", "dome-gallery"),
  item("Drift Wall", "drift-wall"),
  item("Elastic Slider", "elastic-slider"),
  item("Flex Carousel", "flex-carousel"),
  item("Flowing Menu", "flowing-menu"),
  item("Fluid Glass", "fluid-glass"),
  item("Flying Posters", "flying-posters"),
  item("Folder", "folder"),
  item("Swipe Carousel", "swipe-carousel"),
];
