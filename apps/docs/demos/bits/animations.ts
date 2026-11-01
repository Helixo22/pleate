// Component pages for the React Bits inspired set (animations). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import AnimatedContentBasic from "../animated-content/basic";
import BlobCursorBasic from "../blob-cursor/basic";
import CrosshairBasic from "../crosshair/basic";
import CrystalizedBallBasic from "../crystalized-ball/basic";
import CrystalizedBallColors from "../crystalized-ball/colors";
import CubesAccent from "../cubes/accent";
import CubesBasic from "../cubes/basic";
import CursorGridBasic from "../cursor-grid/basic";
import DitherVeilBasic from "../dither-veil/basic";
import DitherVeilCoarse from "../dither-veil/coarse";
import ElasticMeshBasic from "../elastic-mesh/basic";
import ElectricBorderBasic from "../electric-border/basic";
import ElectricLogoBasic from "../electric-logo/basic";
import FadeContentBasic from "../fade-content/basic";
import GhostCursorAccent from "../ghost-cursor/accent";
import GhostCursorBasic from "../ghost-cursor/basic";
import GlareHoverBasic from "../glare-hover/basic";
import GlowCursorBasic from "../glow-cursor/basic";
import GradualBlurBasic from "../gradual-blur/basic";
import HalftoneRevealBasic from "../halftone-reveal/basic";
import HalftoneRevealView from "../halftone-reveal/view";

const CURSOR_A11Y = [
  "Decorative layer, hidden from assistive tech, and it never catches clicks.",
  "Stays inside its container unless global is set. The system cursor stays visible.",
  "Mouse and pen only: touch screens and reduced motion get the plain content.",
];
const GLOBAL = { name: "global", type: "boolean", default: "false", description: "Follow the pointer across the whole page instead of only the container." };
const SPEED = { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." };
const VIEW_PROPS = [
  { name: "delay", type: "number", default: "0", description: "Seconds before it starts." },
  { name: "threshold", type: "number", default: "0.15", description: "Share of the element visible before it plays (0 to 1)." },
  { name: "once", type: "boolean", default: "true", description: "Play once, or every time it enters." },
];
const SHADER_A11Y = ["Decorative canvas, hidden from assistive tech.", "Pauses off screen. Reduced motion shows one still frame. Without WebGL2 only the container background shows."];

export const DOCS_ANIMATIONS: Record<string, ComponentDoc> = {
  "animated-content": {
    name: "Animated Content",
    description: "Slides its content in from any side when it scrolls into view, with optional fade and scale, on a spring or a tween.",
    importName: "AnimatedContent",
    importPath: "pleate/effects/animated-content",
    demos: [{ id: "basic", title: "Directions and motion", description: "Scroll it out of view and back to replay.", align: "stretch", Component: AnimatedContentBasic }],
    props: [
      { name: "direction", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Axis of travel." },
      { name: "distance", type: "number", default: "80", description: "Pixels traveled." },
      { name: "reverse", type: "boolean", default: "false", description: "Come from above or the left." },
      { name: "initialOpacity", type: "number", default: "0", description: "Starting opacity; 1 turns the fade off." },
      { name: "scale", type: "number", default: "1", description: "Starting scale." },
      { name: "motion", type: '"spring" | number', default: '"spring"', description: "A spring, or a tween of that many seconds." },
      ...VIEW_PROPS,
    ],
    a11y: ["Content is in the DOM from the start, so it is read normally.", "Reduced motion renders it in place."],
  },
  "fade-content": {
    name: "Fade Content",
    description: "Fades its content in, optionally out of a blur, when it scrolls into view.",
    importName: "FadeContent",
    importPath: "pleate/effects/fade-content",
    demos: [{ id: "basic", title: "Fade and blur", align: "stretch", Component: FadeContentBasic }],
    props: [
      { name: "blur", type: "boolean", default: "false", description: "Start blurred and sharpen while fading in." },
      { name: "duration", type: "number", default: "1", description: "Seconds." },
      { name: "initialOpacity", type: "number", default: "0", description: "Starting opacity." },
      ...VIEW_PROPS,
    ],
    a11y: ["Content is in the DOM from the start, so it is read normally.", "Reduced motion renders it in place."],
  },
  "blob-cursor": {
    name: "Blob Cursor",
    description: "A few soft blobs trail the cursor and melt into each other, behind the content of their container.",
    importName: "BlobCursor",
    importPath: "pleate/effects/blob-cursor",
    demos: [{ id: "basic", title: "Gooey trail", align: "stretch", Component: BlobCursorBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Blob color." },
      { name: "sizes", type: "number[]", default: "[64, 40, 26]", description: "Diameter of each blob, leader first." },
      { name: "speed", type: "number", default: "0.35", description: "How quickly the leader catches up (0 to 1)." },
      { name: "goo", type: "boolean", default: "true", description: "Melt the blobs together." },
      GLOBAL,
    ],
    a11y: CURSOR_A11Y,
  },
  crosshair: {
    name: "Crosshair",
    description: "Two thin lines meet at the cursor like a viewfinder, with an optional coordinate readout.",
    importName: "Crosshair",
    importPath: "pleate/effects/crosshair",
    demos: [{ id: "basic", title: "Viewfinder", align: "stretch", Component: CrosshairBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Line color." },
      { name: "thickness", type: "number", default: "1", description: "Line width in px." },
      { name: "coordinates", type: "boolean", default: "true", description: "Show x and y next to the cursor." },
      GLOBAL,
    ],
    a11y: CURSOR_A11Y,
  },
  "glow-cursor": {
    name: "Glow Cursor",
    description: "A soft glow trails the cursor with a little lag, with a bright core right at the pointer.",
    importName: "GlowCursor",
    importPath: "pleate/effects/glow-cursor",
    demos: [{ id: "basic", title: "Glow", align: "stretch", Component: GlowCursorBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Glow color." },
      { name: "size", type: "number", default: "280", description: "Glow diameter in px." },
      { name: "intensity", type: "number", default: "0.5", description: "Glow strength (0 to 1)." },
      { name: "core", type: "boolean", default: "true", description: "Small dot at the pointer." },
      GLOBAL,
    ],
    a11y: CURSOR_A11Y,
  },
  "ghost-cursor": {
    name: "Ghost Cursor",
    description: "The cursor leaves a pale, smoky trail that drifts up and fades out.",
    importName: "GhostCursor",
    importPath: "pleate/effects/ghost-cursor",
    demos: [
      { id: "basic", title: "Smoke", align: "stretch", Component: GhostCursorBasic },
      { id: "accent", title: "Accent", align: "stretch", Component: GhostCursorAccent },
    ],
    props: [
      { name: "color", type: "string", default: "var(--pl-fg)", description: "Smoke color." },
      { name: "size", type: "number", default: "22", description: "Puff radius in px when born." },
      { name: "life", type: "number", default: "1.1", description: "Seconds a puff lives." },
      { name: "opacity", type: "number", default: "0.35", description: "Puff opacity (0 to 1)." },
      GLOBAL,
    ],
    a11y: CURSOR_A11Y,
  },
  "cursor-grid": {
    name: "Cursor Grid",
    description: "A field of dots that swell and take the accent near the cursor, then settle back.",
    importName: "CursorGrid",
    importPath: "pleate/effects/cursor-grid",
    demos: [{ id: "basic", title: "Dot field", align: "stretch", Component: CursorGridBasic }],
    props: [
      { name: "gap", type: "number", default: "22", description: "Distance between dots in px." },
      { name: "dotSize", type: "number", default: "1.4", description: "Resting dot radius in px." },
      { name: "radius", type: "number", default: "120", description: "Reach of the cursor in px." },
      { name: "color", type: "string", default: "var(--pl-fg-subtle)", description: "Resting dot color." },
      { name: "activeColor", type: "string", default: "var(--pl-accent)", description: "Color near the cursor." },
    ],
    a11y: CURSOR_A11Y.slice(0, 1).concat("Touch and reduced motion get the still grid."),
  },
  "elastic-mesh": {
    name: "Elastic Mesh",
    description: "A wire grid that bends away from the cursor and springs back, with a ripple on click.",
    importName: "ElasticMesh",
    importPath: "pleate/effects/elastic-mesh",
    demos: [{ id: "basic", title: "Mesh", align: "stretch", Component: ElasticMeshBasic }],
    props: [
      { name: "gap", type: "number", default: "32", description: "Distance between grid points in px." },
      { name: "radius", type: "number", default: "110", description: "Reach of the cursor in px." },
      { name: "strength", type: "number", default: "1", description: "How hard the cursor pushes." },
      { name: "color", type: "string", default: "var(--pl-separator)", description: "Line color." },
    ],
    a11y: CURSOR_A11Y.slice(0, 1).concat("Touch and reduced motion get the still grid."),
  },
  "halftone-reveal": {
    name: "Halftone Reveal",
    description: "A screen of halftone dots covers the content and shrinks away under the cursor, or sweeps off when it scrolls into view.",
    importName: "HalftoneReveal",
    importPath: "pleate/effects/halftone-reveal",
    demos: [
      { id: "basic", title: "Wipe with the cursor", description: "Wiped dots grow back slowly.", align: "stretch", Component: HalftoneRevealBasic },
      { id: "view", title: "On scroll", align: "stretch", Component: HalftoneRevealView },
    ],
    props: [
      { name: "trigger", type: '"hover" | "view"', default: '"hover"', description: "Cursor wipe, or one sweep when in view." },
      { name: "gap", type: "number", default: "12", description: "Distance between dots in px." },
      { name: "radius", type: "number", default: "90", description: "Reach of the cursor in px." },
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Dot color." },
      { name: "heal", type: "number", default: "0.35", description: "How fast dots grow back per second; 0 keeps them gone." },
    ],
    a11y: ["The dots are a decorative canvas; the content underneath is always in the DOM.", "Hover mode needs a mouse: touch and reduced motion get the content uncovered."],
  },
  cubes: {
    name: "Cubes",
    description: "A grid of small 3D cubes that turn to face the cursor, and roll in a wave from wherever you click.",
    importName: "Cubes",
    importPath: "pleate/effects/cubes",
    demos: [
      { id: "basic", title: "Grid", description: "Click for a wave.", Component: CubesBasic },
      { id: "accent", title: "Big turns, accent faces", Component: CubesAccent },
    ],
    props: [
      { name: "grid", type: "number", default: "8", description: "Cubes per row and column." },
      { name: "maxAngle", type: "number", default: "45", description: "Largest turn in degrees." },
      { name: "radius", type: "number", default: "3", description: "Reach of the cursor in cells." },
      { name: "gap", type: "number", default: "0.12", description: "Space between cubes as a share of a cell." },
      { name: "faceColor", type: "string", default: "var(--pl-surface-2)", description: "Face color; sides are shaded from it." },
      { name: "borderColor", type: "string", default: "var(--pl-separator)", description: "Edge color." },
      { name: "ripple", type: "boolean", default: "true", description: "Wave on click." },
    ],
    a11y: ["Decorative, hidden from assistive tech.", "Touch gets the click wave only; reduced motion keeps it still."],
  },
  "crystalized-ball": {
    name: "Crystalized Ball",
    description: "A glass sphere full of slowly turning crystal facets, with a rim light and a highlight that leans toward the cursor.",
    importName: "CrystalizedBall",
    importPath: "pleate/effects/crystalized-ball",
    demos: [
      { id: "basic", title: "Palette accent", description: "Switch palette to see it follow.", Component: CrystalizedBallBasic },
      { id: "colors", title: "Colors and facets", align: "stretch", Component: CrystalizedBallColors },
    ],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Crystal color." },
      { name: "facets", type: "number", default: "7", description: "Facets across the ball." },
      { name: "radius", type: "number", default: "0.42", description: "Ball radius as a share of the shorter side." },
      SPEED,
    ],
    a11y: SHADER_A11Y,
  },
  "dither-veil": {
    name: "Dither Veil",
    description: "A drifting veil of noise drawn as chunky ordered-dither pixels, that parts around the cursor.",
    importName: "DitherVeil",
    importPath: "pleate/effects/dither-veil",
    demos: [
      { id: "basic", title: "Veil", align: "stretch", Component: DitherVeilBasic },
      { id: "coarse", title: "Coarse, no clearing", align: "stretch", Component: DitherVeilCoarse },
    ],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Dot color." },
      { name: "pixelSize", type: "number", default: "4", description: "One dither pixel in px." },
      { name: "scale", type: "number", default: "2.5", description: "Noise zoom: higher means smaller clouds." },
      { name: "clearRadius", type: "number", default: "0.28", description: "Clearing around the cursor as a share of the height; 0 turns it off." },
      SPEED,
    ],
    a11y: SHADER_A11Y,
  },
  "electric-border": {
    name: "Electric Border",
    description: "A border that crackles like a live wire around any content, with a soft glow behind it.",
    importName: "ElectricBorder",
    importPath: "pleate/effects/electric-border",
    demos: [{ id: "basic", title: "Cards and buttons", description: "Set the radius with a rounded class.", align: "stretch", Component: ElectricBorderBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Line and glow color." },
      { name: "thickness", type: "number", default: "2", description: "Line width in px." },
      { name: "chaos", type: "number", default: "6", description: "Displacement in px." },
      { name: "speed", type: "number", default: "1", description: "Crackle rate; 0 holds still." },
    ],
    a11y: ["The border layers are decorative and hidden from assistive tech.", "Reduced motion keeps the border still."],
  },
  "electric-logo": {
    name: "Electric Logo",
    description: "Any logo drawn in currentColor, an SVG or text, charged with electricity: its edges crackle over a soft glow.",
    importName: "ElectricLogo",
    importPath: "pleate/effects/electric-logo",
    demos: [{ id: "basic", title: "SVG and text", Component: ElectricLogoBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Logo color, applied as currentColor." },
      { name: "chaos", type: "number", default: "5", description: "Displacement in px." },
      { name: "speed", type: "number", default: "1", description: "Crackle rate; 0 holds still." },
      { name: "glow", type: "number", default: "14", description: "Glow blur in px; 0 turns it off." },
    ],
    a11y: ["The glow copy is hidden from assistive tech, so the logo is read once. Give an SVG logo an aria-label.", "Reduced motion keeps it still."],
  },
  "glare-hover": {
    name: "Glare Hover",
    description: "A band of light sweeps across the surface when the pointer enters, like light catching glass.",
    importName: "GlareHover",
    importPath: "pleate/effects/glare-hover",
    demos: [{ id: "basic", title: "Glare", align: "stretch", Component: GlareHoverBasic }],
    props: [
      { name: "color", type: "string", default: "white", description: "Glare color." },
      { name: "opacity", type: "number", default: "0.35", description: "Glare strength (0 to 1)." },
      { name: "angle", type: "number", default: "-45", description: "Band direction in degrees." },
      { name: "width", type: "number", default: "0.25", description: "Band width as a share of the surface." },
      { name: "duration", type: "number", default: "700", description: "Sweep in ms." },
    ],
    a11y: ["Decorative layer, hidden from assistive tech.", "Hover devices only; nothing under reduced motion."],
  },
  "gradual-blur": {
    name: "Gradual Blur",
    description: "Content blurs progressively toward one edge, like a frosted fade. Place it in a relative container, or pin it to the viewport.",
    importName: "GradualBlur",
    importPath: "pleate/effects/gradual-blur",
    demos: [{ id: "basic", title: "Bottom edge of a scroll area", align: "stretch", Component: GradualBlurBasic }],
    props: [
      { name: "position", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Edge that blurs." },
      { name: "size", type: "string", default: '"6rem"', description: "Depth of the band (CSS length)." },
      { name: "strength", type: "number", default: "12", description: "Blur at the edge in px." },
      { name: "layers", type: "number", default: "5", description: "Stacked layers: smoother but costlier." },
      { name: "fade", type: "boolean", default: "false", description: "Also fade to the page background." },
      { name: "fixed", type: "boolean", default: "false", description: "Pin to the viewport edge." },
    ],
    a11y: ["Decorative, hidden from assistive tech, and it never catches clicks.", "Static: no motion to turn off."],
  },
};
