// Component pages for the React Bits inspired set (backgrounds-a). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import AcidSquaresBasic from "../acid-squares/basic";
import AeroShardsBasic from "../aero-shards/basic";
import AntigravityBasic from "../antigravity/basic";
import AuroraBasic from "../aurora/basic";
import SwirlBasic from "../swirl/basic";
import BallpitBasic from "../ballpit/basic";
import BeamsBasic from "../beams/basic";
import CrtWarpBasic from "../crt-warp/basic";
import ColorBendsBasic from "../color-bends/basic";
import DarkVeilBasic from "../dark-veil/basic";
import DitherBasic from "../dither/basic";
import DotFieldBasic from "../dot-field/basic";
import DotGridBasic from "../dot-grid/basic";
import IrisBasic from "../iris/basic";
import FaultyTerminalBasic from "../faulty-terminal/basic";
import FerrofluidBasic from "../ferrofluid/basic";
import FloatingLinesBasic from "../floating-lines/basic";
import FluxLinesBasic from "../flux-lines/basic";
import GalaxyBasic from "../galaxy/basic";
import GhostFibersBasic from "../ghost-fibers/basic";
import GradientAsciiBasic from "../gradient-ascii/basic";

const BG_A11Y = [
  "Decorative: the canvas is aria-hidden and ignores pointer events, so content above it stays clickable.",
  "Fills its parent: give it absolute inset-0 inside a positioned element, with the text on top.",
  "Pauses off screen and in hidden tabs. Without WebGL2 it renders nothing, so keep a background color on the parent.",
];

export const DOCS_BACKGROUNDS_A: Record<string, ComponentDoc> = {
  "acid-squares": {
    name: "Acid Squares",
    description: "A rolling field of glossy rounded tiles. A slow wave lifts each tile, two colored lights drift across and catch the bevels, and the pointer swells the tiles under it.",
    importName: "AcidSquares",
    importPath: "pleate/effects/acid-squares",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: AcidSquaresBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +140\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "aero-shards": {
    name: "Aero Shards",
    description: "Ribbons of thick glass shards streaming sideways on three depths, catching light along their edges, over a faint grid of survey markers.",
    importName: "AeroShards",
    importPath: "pleate/effects/aero-shards",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: AeroShardsBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +60\u00b0, bg, fg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "antigravity": {
    name: "Antigravity",
    description: "Small capsules float slowly upward. Near the pointer they are pulled onto a spinning ring around it, then drift away again. Canvas 2D.",
    importName: "Antigravity",
    importPath: "pleate/effects/antigravity",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: AntigravityBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, fg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "2.2", description: "Particles per 10,000 px\u00b2 of area." },
      { name: "ringRadius", type: "number", default: "90", description: "Radius of the ring around the pointer, in px." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "aurora": {
    name: "Aurora",
    description: "Soft curtains of light rippling across the frame with fine vertical rays. The pointer lifts the curtains above it.",
    importName: "Aurora",
    importPath: "pleate/effects/aurora",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: AuroraBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent -70\u00b0, accent +60\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "intensity", type: "number", default: "1", description: "Brightness of the curtains, 0 to 2." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "swirl": {
    name: "Swirl",
    description: "Thick paint in three colors, slowly stirred around the center and drawn in chunky pixels. The pointer pulls the vortex toward it.",
    importName: "Swirl",
    importPath: "pleate/effects/swirl",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: SwirlBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +150\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "pixelSize", type: "number", default: "4", description: "Pixel size in device px; 1 turns pixelation off." },
      { name: "twist", type: "number", default: "2.5", description: "How hard the paint twists around the center." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "ballpit": {
    name: "Ballpit",
    description: "Glossy balls piled up under gravity, bouncing off each other and the frame. Move the pointer through them to shove them around. Canvas 2D with simple physics.",
    importName: "Ballpit",
    importPath: "pleate/effects/ballpit",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: BallpitBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +120\u00b0, fg, accent -120\u00b0]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "count", type: "number", default: "60", description: "Number of balls." },
      { name: "gravity", type: "number", default: "900", description: "Gravity in px/s\u00b2. Zero lets them float." },
      { name: "bounce", type: "number", default: "0.6", description: "Bounciness, 0 to 1." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame with the pile already settled."),
  },
  "beams": {
    name: "Beams",
    description: "Slanted shafts of light falling from the top, each with its own width and a slow shimmer. They slide sideways; the pointer brightens the ones near it.",
    importName: "Beams",
    importPath: "pleate/effects/beams",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: BeamsBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, fg, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "5", description: "Beams across the frame height." },
      { name: "angle", type: "number", default: "14", description: "Slant in degrees." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "crt-warp": {
    name: "CRT Warp",
    description: "A blocky plasma on a curved tube screen, with scanlines, an RGB phosphor mask, a rolling band and a power on intro. The pointer bulges the picture.",
    importName: "CrtWarp",
    importPath: "pleate/effects/crt-warp",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: CrtWarpBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, light accent, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "curvature", type: "number", default: "0.22", description: "Screen curvature, 0 (flat) to 0.4." },
      { name: "blocks", type: "number", default: "40", description: "Plasma blocks across the width." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "color-bends": {
    name: "Color Bends",
    description: "Wide bands of color that bend and flow into each other like light through warped glass. The pointer pushes a soft dent into them.",
    importName: "ColorBends",
    importPath: "pleate/effects/color-bends",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: ColorBendsBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +70\u00b0, accent -80\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "warp", type: "number", default: "1", description: "How much the bands wave, 0 to 2." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "dark-veil": {
    name: "Dark Veil",
    description: "A slow, smoky veil of tinted light folding over itself, with faint scanlines. The pointer stirs the smoke.",
    importName: "DarkVeil",
    importPath: "pleate/effects/dark-veil",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: DarkVeilBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +50\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "scanlines", type: "number", default: "0.5", description: "Strength of the scanlines, 0 to 1." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "dither": {
    name: "Dither",
    description: "Flowing noise waves printed with a 4x4 ordered dither in chunky pixels. The pointer adds a bright spot.",
    importName: "Dither",
    importPath: "pleate/effects/dither",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: DitherBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "pixelSize", type: "number", default: "3", description: "Dither pixel size in device px." },
      { name: "contrast", type: "number", default: "1", description: "Wave contrast, 0 to 2." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "dot-field": {
    name: "Dot Field",
    description: "A halftone field of dots whose size follows drifting noise and a ripple from the center. The pointer swells the dots under it.",
    importName: "DotField",
    importPath: "pleate/effects/dot-field",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: DotFieldBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, muted fg, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "34", description: "Dots across the frame height." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "dot-grid": {
    name: "Dot Grid",
    description: "A calm grid of small dots with a faint shimmer. Near the pointer the dots light up, grow and get pushed away.",
    importName: "DotGrid",
    importPath: "pleate/effects/dot-grid",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: DotGridBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, fg, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "24", description: "Dots across the frame height." },
      { name: "radius", type: "number", default: "0.35", description: "Pointer influence, in frame heights." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "iris": {
    name: "Iris",
    description: "A single glowing eye with fibers in the iris, a breathing slit pupil and a flickering corona. It follows the pointer and wanders when it leaves.",
    importName: "Iris",
    importPath: "pleate/effects/iris",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: IrisBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, light accent, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "flare", type: "number", default: "1", description: "Strength of the corona, 0 to 2." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "faulty-terminal": {
    name: "Faulty Terminal",
    description: "A screen of pixel glyphs typed in ragged lines that keep rewriting, with scanlines, flicker and rows that tear sideways. The pointer brightens nearby text.",
    importName: "FaultyTerminal",
    importPath: "pleate/effects/faulty-terminal",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: FaultyTerminalBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "rows", type: "number", default: "18", description: "Text rows across the frame height." },
      { name: "glitch", type: "number", default: "0.5", description: "Glitch amount, 0 to 1." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "ferrofluid": {
    name: "Ferrofluid",
    description: "A glossy black pool of magnetic fluid. Swells roll across and raise fields of spikes, and the pointer pulls up a crown. The fluid stays dark in both themes.",
    importName: "Ferrofluid",
    importPath: "pleate/effects/ferrofluid",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: FerrofluidBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, light accent, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "22", description: "Spikes across the frame height." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "floating-lines": {
    name: "Floating Lines",
    description: "Thin glowing lines floating on slow, layered waves, shading from one color to another. The pointer draws the nearest lines toward it.",
    importName: "FloatingLines",
    importPath: "pleate/effects/floating-lines",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: FloatingLinesBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +90\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "count", type: "number", default: "14", description: "Number of lines, 2 to 32." },
      { name: "amplitude", type: "number", default: "1", description: "Wave height, 0 to 2." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "flux-lines": {
    name: "Flux Lines",
    description: "Glowing contour lines tracing a churning field. The pointer is a magnet: it lights the lines around it and curls them.",
    importName: "FluxLines",
    importPath: "pleate/effects/flux-lines",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: FluxLinesBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +70\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "1", description: "Line count multiplier." },
      { name: "ambient", type: "number", default: "0.45", description: "Brightness away from the pointer, 0 to 1." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "galaxy": {
    name: "Galaxy",
    description: "Layers of twinkling stars turning slowly over a faint nebula. The pointer shifts the layers by depth.",
    importName: "Galaxy",
    importPath: "pleate/effects/galaxy",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: GalaxyBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +60\u00b0, bg, fg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "density", type: "number", default: "1", description: "Star density multiplier." },
      { name: "nebula", type: "number", default: "0.6", description: "Nebula strength, 0 to 1." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "ghost-fibers": {
    name: "Ghost Fibers",
    description: "Ribbons of fine glowing fibers that twist, fold and drift on three depths with a shallow depth of field. The pointer height picks the ribbon in focus.",
    importName: "GhostFibers",
    importPath: "pleate/effects/ghost-fibers",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: GhostFibersBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +80\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "fibers", type: "number", default: "14", description: "Fibers per ribbon, 2 to 24." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
  "gradient-ascii": {
    name: "Gradient ASCII",
    description: "Soft drifting glows drawn in ASCII characters, from a dot to a dense @, colored along a gradient. Characters scramble under the pointer.",
    importName: "GradientAscii",
    importPath: "pleate/effects/gradient-ascii",
    demos: [{ id: "basic", title: "Behind a title", description: "Move the pointer over the frame.", align: "stretch", Component: GradientAsciiBasic }],
    props: [
      { name: "colors", type: "string[]", default: "[accent, accent +90\u00b0, bg]", description: "CSS colors, tokens included. Missing entries use the default." },
      { name: "speed", type: "number", default: "1", description: "Playback speed multiplier." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "rows", type: "number", default: "22", description: "Character rows across the frame height." },
      { name: "interactive", type: "boolean", default: "true", description: "React to the pointer over the parent element." },
    ],
    a11y: BG_A11Y.concat("Reduced motion draws one still frame."),
  },
};
