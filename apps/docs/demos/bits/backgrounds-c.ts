// Component pages for the React Bits inspired set (backgrounds-c). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import OrbBasic from "../orb/basic";
import ParticlesBasic from "../particles/basic";
import PatternWavesBasic from "../pattern-waves/basic";
import PixelBlastBasic from "../pixel-blast/basic";
import PixelSnowBasic from "../pixel-snow/basic";
import PlasmaBasic from "../plasma/basic";
import PlasmaWaveBasic from "../plasma-wave/basic";
import PrismBasic from "../prism/basic";
import PrismaticBurstBasic from "../prismatic-burst/basic";
import RadarBasic from "../radar/basic";
import RippleGridBasic from "../ripple-grid/basic";
import ScannerBasic from "../scanner/basic";
import ShapeGridBasic from "../shape-grid/basic";
import ShapeWavesBasic from "../shape-waves/basic";
import SideRaysBasic from "../side-rays/basic";
import SilkBasic from "../silk/basic";
import SlicedWavesBasic from "../sliced-waves/basic";
import SoftAuroraBasic from "../soft-aurora/basic";
import ThreadsBasic from "../threads/basic";
import TopographyBasic from "../topography/basic";
import WavesBasic from "../waves/basic";
import WebThreadsBasic from "../web-threads/basic";

const A11Y = (tech: string) => [
  "Decorative: the canvas is aria-hidden and ignores pointer events, so content on top stays clickable.",
  "Pauses off screen and in hidden tabs; reduced motion shows one still frame.",
  `${tech}.`,
];

export const DOCS_BACKGROUNDS_C: Record<string, ComponentDoc> = {
  "orb": {
    name: "Orb",
    description: "A glowing ring with a noisy, living edge. Colors drift around it and the edge grows wilder as the pointer nears the center. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Orb",
    importPath: "pleate/effects/orb",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: OrbBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [ring, ring alt, highlight]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "particles": {
    name: "Particles",
    description: "A slowly turning 3D cloud of dots, near ones bigger and brighter. The pointer tilts the cloud. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Particles",
    importPath: "pleate/effects/particles",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: ParticlesBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: any number; each dot takes one. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "count", type: "number", default: "220", description: "Number of dots." },
    ],
    a11y: A11Y("Canvas 2D"),
  },
  "pattern-waves": {
    name: "Pattern Waves",
    description: "A halftone grid whose marks swell and shrink as waves pass through it. The pointer adds a swell of its own. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "PatternWaves",
    importPath: "pleate/effects/pattern-waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PatternWavesBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [small marks, large marks]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "pattern", type: "\"dots\" | \"squares\" | \"lines\"", default: "\"dots\"", description: "Mark shape." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "pixel-blast": {
    name: "Pixel Blast",
    description: "Drifting noise drawn as a dithered field of chunky pixels. The pointer sends ripples through it. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "PixelBlast",
    importPath: "pleate/effects/pixel-blast",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PixelBlastBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [low, high]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "shape", type: "\"square\" | \"circle\"", default: "\"square\"", description: "Pixel shape." },
      { name: "density", type: "number", default: "0.5", description: "How much of the field is lit, 0 to 1." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "pixel-snow": {
    name: "Pixel Snow",
    description: "Square flakes falling in layers, near ones bigger and faster. The pointer is the wind. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "PixelSnow",
    importPath: "pleate/effects/pixel-snow",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PixelSnowBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [flakes]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "density", type: "number", default: "0.5", description: "How many flakes, 0 to 1." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "plasma": {
    name: "Plasma",
    description: "Thick flowing color folded over itself again and again. The flow bends towards the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Plasma",
    importPath: "pleate/effects/plasma",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PlasmaBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [main, second]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "plasma-wave": {
    name: "Plasma Wave",
    description: "A few glowing waveforms that cross and breathe. The lines lean towards the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "PlasmaWave",
    importPath: "pleate/effects/plasma-wave",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PlasmaWaveBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [first line, last line]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "lines", type: "number", default: "5", description: "Number of waveforms, 1 to 8." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "prism": {
    name: "Prism",
    description: "A glass triangle that catches a thin beam and fans it out into a spectrum. It turns with the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Prism",
    importPath: "pleate/effects/prism",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PrismBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [edge, glow tint]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "prismatic-burst": {
    name: "Prismatic Burst",
    description: "Spectral rays bursting from a bright core and slowly turning. The core leans towards the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "PrismaticBurst",
    importPath: "pleate/effects/prismatic-burst",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: PrismaticBurstBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [tint]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "tint", type: "number", default: "0.3", description: "How much the rays take the tint color, 0 to 1." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "radar": {
    name: "Radar",
    description: "A sweep turning over range rings and spokes, lighting up contacts as it passes. The pointer shows up as a contact. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Radar",
    importPath: "pleate/effects/radar",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: RadarBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [sweep, grid]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "ripple-grid": {
    name: "Ripple Grid",
    description: "A fine grid rippling outwards from the center, and again from the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "RippleGrid",
    importPath: "pleate/effects/ripple-grid",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: RippleGridBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [lines, crest]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "scanner": {
    name: "Scanner",
    description: "A bright beam sliding back and forth over a dot matrix, waking the dots it passes. Hover to steer the beam. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Scanner",
    importPath: "pleate/effects/scanner",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: ScannerBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [beam, dots]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "shape-grid": {
    name: "Shape Grid",
    description: "A grid of outlined shapes drifting diagonally. Cells under the pointer fill in and fade out behind it. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "ShapeGrid",
    importPath: "pleate/effects/shape-grid",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: ShapeGridBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [outline, hover fill]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "shape", type: "\"square\" | \"circle\" | \"hexagon\" | \"triangle\"", default: "\"square\"", description: "Cell shape." },
      { name: "cell", type: "number", default: "44", description: "Cell size in px, times scale." },
    ],
    a11y: A11Y("Canvas 2D"),
  },
  "shape-waves": {
    name: "Shape Waves",
    description: "Nested polygon outlines wobbling like a struck string. The center drifts towards the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "ShapeWaves",
    importPath: "pleate/effects/shape-waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: ShapeWavesBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [inner, outer]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "sides", type: "number", default: "6", description: "Polygon sides; 0 draws circles." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "side-rays": {
    name: "Side Rays",
    description: "Shafts of light pouring in from the two top corners. With the pointer over it, the light turns to look. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "SideRays",
    importPath: "pleate/effects/side-rays",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: SideRaysBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [left, right]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "silk": {
    name: "Silk",
    description: "Slow folds of shiny fabric with a fine grain. Opaque: it paints the whole area in deep tones, so set light text on it. The folds turn towards the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Silk",
    importPath: "pleate/effects/silk",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: SilkBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [fabric, sheen]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "sliced-waves": {
    name: "Sliced Waves",
    description: "A wave pattern cut into horizontal strips, each sliding on its own. Strips near the pointer slide further. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "SlicedWaves",
    importPath: "pleate/effects/sliced-waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: SlicedWavesBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [low, high]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "slices", type: "number", default: "14", description: "Number of strips." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "soft-aurora": {
    name: "Soft Aurora",
    description: "Soft curtains of light drifting across the frame, brighter near the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "SoftAurora",
    importPath: "pleate/effects/soft-aurora",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: SoftAuroraBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [low, mid, high]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "threads": {
    name: "Threads",
    description: "A loose bundle of fine lines rippling across the frame. The bundle reaches for the pointer. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Threads",
    importPath: "pleate/effects/threads",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: ThreadsBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [first thread, last thread]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "count", type: "number", default: "24", description: "Number of threads, up to 40." },
      { name: "amplitude", type: "number", default: "1", description: "How far the threads wander." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "topography": {
    name: "Topography",
    description: "Contour lines of slowly shifting terrain, every fifth one an index line. The pointer raises a hill. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Topography",
    importPath: "pleate/effects/topography",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: TopographyBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [lines, index lines]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
    ],
    a11y: A11Y("WebGL2 shader; renders nothing without WebGL2, so keep a background color behind it"),
  },
  "waves": {
    name: "Waves",
    description: "A curtain of vertical lines swaying on layered waves. The pointer pushes the lines aside. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "Waves",
    importPath: "pleate/effects/waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: WavesBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [lines]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "gap", type: "number", default: "14", description: "Space between lines in px, times scale." },
      { name: "amplitude", type: "number", default: "26", description: "How far the lines sway in px." },
    ],
    a11y: A11Y("Canvas 2D"),
  },
  "web-threads": {
    name: "Web Threads",
    description: "Drifting points joined by fine threads when they come close. The pointer joins in and gathers the web. Fills its parent: place it with absolute inset-0 behind your content.",
    importName: "WebThreads",
    importPath: "pleate/effects/web-threads",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: WebThreadsBasic }],
    props: [
      { name: "colors", type: "string[]", description: "CSS colors or tokens: [points, threads]. Defaults follow the palette." },
      { name: "speed", type: "number", default: "1", description: "Playback speed." },
      { name: "scale", type: "number", default: "1", description: "Pattern size; above 1 is bigger." },
      { name: "interactive", type: "boolean", default: "true", description: "Follow the pointer over the parent element." },
      { name: "density", type: "number", default: "9", description: "Points per 100,000 px\u00b2 of area." },
      { name: "reach", type: "number", default: "120", description: "Longest thread in px, times scale." },
    ],
    a11y: A11Y("Canvas 2D"),
  },
};
