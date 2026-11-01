// Component pages for the React Bits inspired set (backgrounds-b). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import GradientBlindsBasic from "../gradient-blinds/basic";
import GradientWavesBasic from "../gradient-waves/basic";
import GrainientBasic from "../grainient/basic";
import GridDistortionBasic from "../grid-distortion/basic";
import GridMotionBasic from "../grid-motion/basic";
import GridScanBasic from "../grid-scan/basic";
import HyperspeedBasic from "../hyperspeed/basic";
import IridescenceBasic from "../iridescence/basic";
import LetterGlitchBasic from "../letter-glitch/basic";
import LightPillarBasic from "../light-pillar/basic";
import LightRaysBasic from "../light-rays/basic";
import LightTunnelBasic from "../light-tunnel/basic";
import LightfallBasic from "../lightfall/basic";
import LightningBasic from "../lightning/basic";
import LineWavesBasic from "../line-waves/basic";
import LiquidChromeBasic from "../liquid-chrome/basic";
import LiquidEtherBasic from "../liquid-ether/basic";
import MagicRingsBasic from "../magic-rings/basic";
import MagnetLinesBasic from "../magnet-lines/basic";
import MicroSlatsBasic from "../micro-slats/basic";
import MoltenMetalBasic from "../molten-metal/basic";

const A11Y = [
  "Decorative: the canvas is aria-hidden and ignores pointer events, so content on top stays usable.",
  "Pauses off screen and in hidden tabs; with reduced motion it shows a still frame.",
  "Fills its parent: give the parent position relative and the background absolute inset-0."
];

export const DOCS_BACKGROUNDS_B: Record<string, ComponentDoc> = {
  "gradient-blinds": {
    name: "Gradient Blinds",
    description: "A flowing gradient seen through folded blinds, with a spotlight that follows the pointer.",
    importName: "GradientBlinds",
    importPath: "pleate/effects/gradient-blinds",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GradientBlindsBasic }],
    props: [{"name":"blinds","type":"number","default":"14","description":"Number of blinds across the height of the canvas."},{"name":"angle","type":"number","default":"0","description":"Tilt of the blinds in degrees."},{"name":"spotlight","type":"number","default":"0.5","description":"Strength of the pointer spotlight, 0 to turn it off."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: light, mid and deep stops of the gradient. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "gradient-waves": {
    name: "Gradient Waves",
    description: "Soft stacked waves rolling along the bottom, each a step of a gradient. The pointer lifts the crests.",
    importName: "GradientWaves",
    importPath: "pleate/effects/gradient-waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GradientWavesBasic }],
    props: [{"name":"waves","type":"number","default":"5","description":"Number of wave layers (1 to 8)."},{"name":"height","type":"number","default":"0.7","description":"How far up the back wave reaches, 0 to 1."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: front, middle and back waves. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "grainient": {
    name: "Grainient",
    description: "A slow warped gradient of three colors with film grain on top.",
    importName: "Grainient",
    importPath: "pleate/effects/grainient",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GrainientBasic }],
    props: [{"name":"grain","type":"number","default":"0.08","description":"Grain strength, 0 to turn it off."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: three gradient colors. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "grid-distortion": {
    name: "Grid Distortion",
    description: "An image or palette gradient cut into cells that the pointer drags around; they settle back when it stops.",
    importName: "GridDistortion",
    importPath: "pleate/effects/grid-distortion",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GridDistortionBasic }],
    props: [{"name":"src","type":"string","description":"Image to distort, drawn to cover. Palette gradient when omitted."},{"name":"grid","type":"number","default":"12","description":"Cells along the short side."},{"name":"strength","type":"number","default":"0.15","description":"How far cells follow the pointer."},{"name":"radius","type":"number","default":"0.25","description":"Pointer reach as a share of the short side."},{"name":"relaxation","type":"number","default":"0.9","description":"How fast cells settle back, 0 to 1."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: light, mid and deep stops of the default gradient. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "grid-motion": {
    name: "Grid Motion",
    description: "A tilted wall of tiles whose rows slide with the pointer, each with its own lag and direction. Tiles take any content.",
    importName: "GridMotion",
    importPath: "pleate/effects/grid-motion",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GridMotionBasic }],
    props: [{"name":"items","type":"ReactNode[]","description":"Tile contents, reused in order. Empty tiles when omitted."},{"name":"rows / columns","type":"number","default":"4 / 7","description":"Grid size."},{"name":"angle","type":"number","default":"-12","description":"Tilt of the wall in degrees."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: tile fill and backdrop glow. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "grid-scan": {
    name: "Grid Scan",
    description: "A perspective grid on floor and ceiling with a bright scan band sweeping to the horizon.",
    importName: "GridScan",
    importPath: "pleate/effects/grid-scan",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: GridScanBasic }],
    props: [{"name":"density","type":"number","default":"1","description":"Grid cells per unit of depth."},{"name":"scanSpeed","type":"number","default":"1","description":"Speed of the scan band."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: grid lines and the scan band. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "hyperspeed": {
    name: "Hyperspeed",
    description: "A night highway in perspective with streaks of lights racing both ways. Pure WebGL2, no 3D library.",
    importName: "Hyperspeed",
    importPath: "pleate/effects/hyperspeed",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: HyperspeedBasic }],
    props: [{"name":"lanes","type":"number","default":"3","description":"Lanes in each direction (1 to 4)."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: outgoing lights, incoming lights and lane markings. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "iridescence": {
    name: "Iridescence",
    description: "An oil on water sheen of folding interference bands, tinted by one color.",
    importName: "Iridescence",
    importPath: "pleate/effects/iridescence",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: IridescenceBasic }],
    props: [{"name":"amplitude","type":"number","default":"1","description":"How strongly the pointer shifts the pattern."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: the tint. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "letter-glitch": {
    name: "Letter Glitch",
    description: "A screen of monospace characters flipping to new glyphs and colors, faster around the pointer, with a vignette.",
    importName: "LetterGlitch",
    importPath: "pleate/effects/letter-glitch",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LetterGlitchBasic }],
    props: [{"name":"characters","type":"string","description":"Characters to draw from."},{"name":"fontSize","type":"number","default":"16","description":"Glyph size in px."},{"name":"rate","type":"number","default":"0.6","description":"Share of glyphs that change every second."},{"name":"vignette","type":"boolean","default":"true","description":"Fade the edges into the background."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: up to three glyph colors, then the vignette color. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "light-pillar": {
    name: "Light Pillar",
    description: "A tall shaft of light with drifting haze, fading between two colors. It leans toward the pointer.",
    importName: "LightPillar",
    importPath: "pleate/effects/light-pillar",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LightPillarBasic }],
    props: [{"name":"width","type":"number","default":"1","description":"Width multiplier of the pillar."},{"name":"intensity","type":"number","default":"1","description":"Brightness of the glow."},{"name":"rotation","type":"number","default":"0","description":"Rotation of the pillar in degrees."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: top and bottom of the pillar. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "light-rays": {
    name: "Light Rays",
    description: "Shafts of light fanning down from above, flickering slowly and bending toward the pointer.",
    importName: "LightRays",
    importPath: "pleate/effects/light-rays",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LightRaysBasic }],
    props: [{"name":"originX","type":"number","default":"0.5","description":"Horizontal position of the light source, 0 (left) to 1 (right)."},{"name":"spread","type":"number","default":"1","description":"Width of the fan of rays."},{"name":"length","type":"number","default":"1.2","description":"How far the rays reach (in canvas heights)."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: the light. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "light-tunnel": {
    name: "Light Tunnel",
    description: "Flying down a tunnel of rings and streaks of light. The pointer moves the vanishing point.",
    importName: "LightTunnel",
    importPath: "pleate/effects/light-tunnel",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LightTunnelBasic }],
    props: [{"name":"rings","type":"number","default":"1","description":"Ring density."},{"name":"segments","type":"number","default":"12","description":"Light streaks around the tunnel."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: near and far colors. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "lightfall": {
    name: "Lightfall",
    description: "Thin streaks of light falling in columns, each with a bright head and a fading tail.",
    importName: "Lightfall",
    importPath: "pleate/effects/lightfall",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LightfallBasic }],
    props: [{"name":"density","type":"number","default":"0.5","description":"Share of columns with streaks, 0 to 1."},{"name":"columns","type":"number","default":"36","description":"Columns across the height of the canvas."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: two colors the streaks mix between. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "lightning": {
    name: "Lightning",
    description: "A flickering electric bolt with a soft glow that follows the pointer across.",
    importName: "Lightning",
    importPath: "pleate/effects/lightning",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LightningBasic }],
    props: [{"name":"intensity","type":"number","default":"1","description":"Brightness of the bolt and its glow."},{"name":"x","type":"number","default":"0","description":"Horizontal position, -1 (left edge) to 1 (right edge)."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: the bolt. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "line-waves": {
    name: "Line Waves",
    description: "A stack of thin lines undulating like a sound wave. The pointer parts the lines around it.",
    importName: "LineWaves",
    importPath: "pleate/effects/line-waves",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LineWavesBasic }],
    props: [{"name":"lines","type":"number","default":"28","description":"Number of lines."},{"name":"amplitude","type":"number","default":"1","description":"Height of the waves."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: bottom and top lines. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "liquid-chrome": {
    name: "Liquid Chrome",
    description: "A sheet of molten chrome folding over itself. The pointer sends ripples through it.",
    importName: "LiquidChrome",
    importPath: "pleate/effects/liquid-chrome",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LiquidChromeBasic }],
    props: [{"name":"ripple","type":"number","default":"1","description":"Strength of the pointer ripples, 0 to turn them off."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: highlight and shadow tones. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "liquid-ether": {
    name: "Liquid Ether",
    description: "Colored smoke stirred by the pointer: a small fluid simulation on the GPU that stirs itself when idle.",
    importName: "LiquidEther",
    importPath: "pleate/effects/liquid-ether",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: LiquidEtherBasic }],
    props: [{"name":"force","type":"number","default":"1","description":"Force the pointer puts into the fluid."},{"name":"radius","type":"number","default":"0.1","description":"Splat radius as a share of the short side."},{"name":"persistence","type":"number","default":"1","description":"How long the dye lingers."},{"name":"autoDemo","type":"boolean","default":"true","description":"Stir by itself without a pointer."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: three dye colors, then the backdrop. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "magic-rings": {
    name: "Magic Rings",
    description: "Concentric glowing rings that wobble and pulse, each with a bright arc spinning around it.",
    importName: "MagicRings",
    importPath: "pleate/effects/magic-rings",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: MagicRingsBasic }],
    props: [{"name":"rings","type":"number","default":"6","description":"Number of rings (1 to 10)."},{"name":"glow","type":"number","default":"1","description":"Glow strength."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: inner and outer rings. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "magnet-lines": {
    name: "Magnet Lines",
    description: "A grid of short lines that turn to point at the cursor like compass needles.",
    importName: "MagnetLines",
    importPath: "pleate/effects/magnet-lines",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: MagnetLinesBasic }],
    props: [{"name":"spacing","type":"number","default":"34","description":"Distance between lines in px."},{"name":"length","type":"number","default":"16","description":"Line length in px."},{"name":"thickness","type":"number","default":"2","description":"Line width in px."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: lines near and far from the target. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "micro-slats": {
    name: "Micro Slats",
    description: "A wall of very thin slats tilting in slow waves and catching the light. The pointer flips the slats under it.",
    importName: "MicroSlats",
    importPath: "pleate/effects/micro-slats",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: MicroSlatsBasic }],
    props: [{"name":"slats","type":"number","default":"90","description":"Number of slats across the width."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: lit and shaded faces. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
  "molten-metal": {
    name: "Molten Metal",
    description: "A churning pool of liquid metal, glowing in the seams and cooling to a dark crust. The pointer heats it.",
    importName: "MoltenMetal",
    importPath: "pleate/effects/molten-metal",
    demos: [{ id: "basic", title: "Behind a headline", align: "stretch", Component: MoltenMetalBasic }],
    props: [{"name":"heat","type":"number","default":"1","description":"How much of the surface glows."},{"name":"colors","type":"string[]","description":"CSS colors or tokens: hot, warm and crust tones. Defaults follow the palette."},{"name":"speed","type":"number","default":"1","description":"Playback speed."},{"name":"scale","type":"number","default":"1","description":"Pattern size; above 1 is bigger."},{"name":"interactive","type":"boolean","default":"true","description":"React to the pointer over the parent."}],
    a11y: A11Y,
  },
};
