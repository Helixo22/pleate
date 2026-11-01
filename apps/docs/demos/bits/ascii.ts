// Component page for AsciiRipple. Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import AsciiRippleBasic from "../ascii-ripple/basic";
import AsciiRippleCustom from "../ascii-ripple/custom";

export const DOCS_ASCII: Record<string, ComponentDoc> = {
  "ascii-ripple": {
    name: "ASCII Ripple",
    description: "A field of monospace characters that ripples like water under the pointer. Taps drop bigger waves, and an idle drop keeps it alive when nobody is around.",
    importName: "AsciiRipple",
    importPath: "pleate/effects/ascii-ripple",
    demos: [
      { id: "basic", title: "Behind a title", align: "stretch", Component: AsciiRippleBasic },
      { id: "custom", title: "Custom glyphs and colors", description: "Bigger cells, round glyphs, slower damping, inverted colors.", align: "stretch", Component: AsciiRippleCustom },
    ],
    props: [
      { name: "charset", type: "string", default: '" .:-=+*#%@"', description: "Glyphs from light to dense. A leading space keeps calm water empty." },
      { name: "cellSize", type: "number", default: "14", description: "Font size of one cell in px." },
      { name: "color", type: "string", default: '"var(--pl-accent)"', description: "Color of the wave crests." },
      { name: "baseColor", type: "string", default: '"var(--pl-fg)"', description: "Color of the calm field." },
      { name: "baseOpacity", type: "number", default: "0.16", description: "Opacity of the calm field." },
      { name: "damping", type: "number", default: "0.965", description: "How long ripples last, 0.9 to 0.995." },
      { name: "idle", type: "boolean", default: "true", description: "Drop ripples on its own when no pointer is around." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer and taps over the parent element." },
    ],
    a11y: [
      "Decorative: the canvas is aria-hidden and ignores pointer events, so content above it stays clickable.",
      "Reduced motion draws one still frame with a ripple already in it.",
      "Pauses off screen and in hidden tabs.",
    ],
  },
};
