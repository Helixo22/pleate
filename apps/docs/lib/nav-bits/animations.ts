// Sidebar entries for the React Bits inspired set (animations). Merged into NAV in lib/nav.ts.
import type { NavItem } from "../nav";

const item = (name: string, slug: string): NavItem => ({ name, href: `/components/${slug}`, ready: true });

export const NAV_ANIMATIONS: NavItem[] = [
  item("Animated Content", "animated-content"),
  item("Blob Cursor", "blob-cursor"),
  item("Crosshair", "crosshair"),
  item("Crystalized Ball", "crystalized-ball"),
  item("Cubes", "cubes"),
  item("Cursor Grid", "cursor-grid"),
  item("Dither Veil", "dither-veil"),
  item("Elastic Mesh", "elastic-mesh"),
  item("Electric Border", "electric-border"),
  item("Electric Logo", "electric-logo"),
  item("Fade Content", "fade-content"),
  item("Ghost Cursor", "ghost-cursor"),
  item("Glare Hover", "glare-hover"),
  item("Glow Cursor", "glow-cursor"),
  item("Gradual Blur", "gradual-blur"),
  item("Halftone Reveal", "halftone-reveal"),
];
