// Component pages for the React Bits inspired set (text). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import GlitchTextBasic from "../glitch-text/basic";
import ScrambledTextBasic from "../scrambled-text/basic";
import ShuffleBasic from "../shuffle/basic";
import SplitTextBasic from "../split-text/basic";
import TextCursorBasic from "../text-cursor/basic";
import TextLoopBasic from "../text-loop/basic";
import TextTypeBasic from "../text-type/basic";
import TextTypeTerminal from "../text-type/terminal";
import TrueFocusBasic from "../true-focus/basic";
import CircularTextBasic from "../circular-text/basic";
import CurvedLoopBasic from "../curved-loop/basic";
import CurvedLoopFlat from "../curved-loop/flat";
import ScrollFloatBasic from "../scroll-float/basic";
import ScrollVelocityBasic from "../scroll-velocity/basic";
import EchoTextBasic from "../echo-text/basic";
import MaskedHeadingBasic from "../masked-heading/basic";
import SplitFlapTextBasic from "../split-flap-text/basic";
import StrokeTextBasic from "../stroke-text/basic";
import TechTextBasic from "../tech-text/basic";
import AsciiTextBasic from "../ascii-text/basic";
import AsciiTextStill from "../ascii-text/still";
import ParticleTextBasic from "../particle-text/basic";
import ParticleTextDense from "../particle-text/dense";
import FallingTextBasic from "../falling-text/basic";
import FallingTextClick from "../falling-text/click";
import FuzzyTextBasic from "../fuzzy-text/basic";
import FuzzyTextAccent from "../fuzzy-text/accent";
import TextPressureBasic from "../text-pressure/basic";
import TextPressureAlpha from "../text-pressure/alpha";
import VariableProximityBasic from "../variable-proximity/basic";
import VariableProximityGaussian from "../variable-proximity/gaussian";
import WarpTextBasic from "../warp-text/basic";
import WarpTextStrong from "../warp-text/strong";
import DepthTextBasic from "../depth-text/basic";
import DepthTextMono from "../depth-text/mono";
import FoldTextBasic from "../fold-text/basic";
import FoldTextHover from "../fold-text/hover";

const AS = { name: "as", type: "ElementType", description: "Element to render." };
const CLASS = { name: "className", type: "string", description: "Classes for the root (type size, color)." };

export const DOCS_TEXT: Record<string, ComponentDoc> = {
  "split-text": {
    name: "Split Text",
    description: "Letters or words rise into place one after another when the text scrolls into view. The start offset, opacity and tilt are yours to set.",
    importName: "SplitText",
    importPath: "pleate/effects/split-text",
    demos: [{ id: "basic", title: "Letters and tilted words", align: "stretch", Component: SplitTextBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "by", type: '"letter" | "word"', default: '"letter"', description: "How the text is cut." },
      { name: "from", type: "{ x?, y?, opacity?, rotate? }", default: "{ y: 40, opacity: 0 }", description: "Where each piece starts." },
      { name: "stagger / duration / delay", type: "number", default: "auto / 0.6 / 0", description: "Timing in seconds." },
      { name: "once", type: "boolean", default: "true", description: "Play only the first time it enters the view." },
      { name: "onComplete", type: "() => void", description: "Called after the last piece lands." },
      AS,
    ],
    a11y: ["The full sentence is read once; the pieces are hidden from assistive tech.", "Reduced motion shows the text in place."],
  },
  "text-type": {
    name: "Text Type",
    description: "A typewriter. Types a sentence, waits, deletes it and types the next, with a blinking cursor.",
    importName: "TextType",
    importPath: "pleate/effects/text-type",
    demos: [
      { id: "basic", title: "Cycling sentences", Component: TextTypeBasic },
      { id: "terminal", title: "Type once", description: "loop={false} stops on the last sentence.", Component: TextTypeTerminal },
    ],
    props: [
      { name: "text", type: "string | string[]", description: "One sentence, or several to cycle through." },
      { name: "typingSpeed / deletingSpeed", type: "number", default: "55 / 30", description: "Milliseconds per character." },
      { name: "pause", type: "number", default: "1600", description: "Milliseconds a finished sentence stays." },
      { name: "loop", type: "boolean", default: "true", description: "Start over after the last sentence." },
      { name: "startOnView", type: "boolean", default: "true", description: "Wait until it is on screen." },
      { name: "cursor / showCursor", type: "string / boolean", default: '"|" / true', description: "The cursor mark." },
      CLASS,
    ],
    a11y: ["Every sentence is read once, not letter by letter.", "Reduced motion shows the first sentence complete, without a cursor."],
  },
  "text-cursor": {
    name: "Text Cursor",
    description: "The pointer leaves a trail of small text marks that drift and fade over an area.",
    importName: "TextCursor",
    importPath: "pleate/effects/text-cursor",
    demos: [{ id: "basic", title: "Trail", align: "stretch", Component: TextCursorBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "Area content; the trail draws over it." },
      { name: "text", type: "string", default: '"+"', description: "The mark left behind." },
      { name: "spacing", type: "number", default: "28", description: "Pixels between marks." },
      { name: "maxPoints", type: "number", default: "14", description: "Most marks at once." },
      { name: "duration", type: "number", default: "0.9", description: "Seconds to fade." },
      { name: "randomFloat", type: "boolean", default: "true", description: "Marks drift and spin a little." },
    ],
    a11y: ["The trail is decorative and hidden from assistive tech.", "Off on touch screens and with reduced motion."],
  },
  "true-focus": {
    name: "True Focus",
    description: "One word is sharp inside a bracket frame while the rest blur. The focus walks along the sentence, or follows the pointer.",
    importName: "TrueFocus",
    importPath: "pleate/effects/true-focus",
    demos: [{ id: "basic", title: "Timed and manual", Component: TrueFocusBasic }],
    props: [
      { name: "text", type: "string", description: "Words separated by spaces." },
      { name: "manual", type: "boolean", default: "false", description: "Follow the pointer instead of a timer." },
      { name: "blur", type: "number", default: "5", description: "Blur of the other words (px)." },
      { name: "interval / duration", type: "number", default: "1.4 / 0.45", description: "Seconds per word and per move." },
      { name: "color", type: "string", default: "accent", description: "Frame color." },
    ],
    a11y: ["The sentence is read once as plain text.", "Reduced motion shows every word sharp, with no frame."],
  },
  "scrambled-text": {
    name: "Scrambled Text",
    description: "Letters near the pointer break into symbols for a moment, then settle back.",
    importName: "ScrambledText",
    importPath: "pleate/effects/scrambled-text",
    demos: [{ id: "basic", title: "Paragraph", Component: ScrambledTextBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "radius", type: "number", default: "90", description: "Pixels around the pointer that scramble." },
      { name: "duration", type: "number", default: "0.8", description: "Seconds a letter stays scrambled." },
      { name: "characters", type: "string", description: "Pool of symbols." },
      { name: "scrambledClassName", type: "string", default: '"text-accent-ink"', description: "Classes for scrambled letters." },
    ],
    a11y: ["Assistive tech always gets the real text.", "Off on touch screens and with reduced motion."],
  },
  shuffle: {
    name: "Shuffle",
    description: "Each letter is a slot that spins through random characters and lands on the real one, in sequence, on view and again on hover.",
    importName: "Shuffle",
    importPath: "pleate/effects/shuffle",
    demos: [{ id: "basic", title: "Up and down", Component: ShuffleBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "shuffles", type: "number", default: "6", description: "Characters passed before landing." },
      { name: "duration / stagger", type: "number", default: "0.55 / 0.04", description: "Seconds per slot and between slots." },
      { name: "direction", type: '"up" | "down"', default: '"up"', description: "Spin direction." },
      { name: "replayOnHover", type: "boolean", default: "true", description: "Spin again on hover and focus." },
    ],
    a11y: ["The word is read once; the slots are hidden from assistive tech.", "Reduced motion shows plain text."],
  },
  "glitch-text": {
    name: "Glitch Text",
    description: "Two offset copies in split colors flicker through random slices, like a bad signal. Always on, or only on hover.",
    importName: "GlitchText",
    importPath: "pleate/effects/glitch-text",
    demos: [{ id: "basic", title: "Always and on hover", Component: GlitchTextBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "The text." },
      { name: "speed", type: "number", default: "0.5", description: "Seconds per cycle." },
      { name: "onHover", type: "boolean", default: "false", description: "Glitch only while hovered or focused." },
      { name: "offset", type: "number", default: "3", description: "Sideways shift of the copies (px)." },
      { name: "colors", type: "[string, string]", default: "accent, pink", description: "Copy colors." },
    ],
    a11y: ["The copies are hidden from assistive tech.", "Reduced motion removes the copies."],
  },
  "text-loop": {
    name: "Text Loop",
    description: "Phrases roll upward through a drum, one step at a time, forever. Show one slot or keep faded neighbors in view.",
    importName: "TextLoop",
    importPath: "pleate/effects/text-loop",
    demos: [{ id: "basic", title: "Inline and drum", Component: TextLoopBasic }],
    props: [
      { name: "items", type: "string[]", description: "Phrases." },
      { name: "interval / duration", type: "number", default: "2 / 0.6", description: "Seconds per phrase and per step." },
      { name: "rows", type: "1 | 3 | 5", default: "1", description: "Visible rows." },
      CLASS,
    ],
    a11y: ["Every phrase is read once, as a list.", "Reduced motion stops the drum on the first phrase."],
  },
  "circular-text": {
    name: "Circular Text",
    description: "Letters set around a circle that turns slowly, like a stamp or a badge. Hover speeds it up, slows it down or pauses it.",
    importName: "CircularText",
    importPath: "pleate/effects/circular-text",
    demos: [{ id: "basic", title: "Badge and stamp", description: "The second one pauses on hover.", Component: CircularTextBasic }],
    props: [
      { name: "text", type: "string", description: "End it with a separator so the loop reads cleanly." },
      { name: "seconds", type: "number", default: "20", description: "Seconds per turn." },
      { name: "onHover", type: '"speedUp" | "slowDown" | "pause" | "none"', default: '"speedUp"', description: "What hovering does." },
      { name: "size", type: "number", default: "180", description: "Diameter in px." },
    ],
    a11y: ["Screen readers get the text once; the rotated letters are hidden from them.", "Reduced motion keeps it still."],
  },
  "curved-loop": {
    name: "Curved Loop",
    description: "A marquee running along a curve. Drag it to scrub; let go and it keeps going the way you threw it.",
    importName: "CurvedLoop",
    importPath: "pleate/effects/curved-loop",
    demos: [
      { id: "basic", title: "Drag it", align: "stretch", Component: CurvedLoopBasic },
      { id: "flat", title: "Arched up, running right", align: "stretch", Component: CurvedLoopFlat },
    ],
    props: [
      { name: "text", type: "string", description: "Repeated along the curve." },
      { name: "curve", type: "number", default: "280", description: "How far the middle bends down; negative bends up." },
      { name: "speed", type: "number", default: "2", description: "Units per frame." },
      { name: "direction", type: '"left" | "right"', default: '"left"', description: "Starting direction." },
      { name: "interactive", type: "boolean", default: "true", description: "Drag to scrub and fling." },
    ],
    a11y: ["The text is read once; the repeated copies are hidden.", "Reduced motion stops it and turns off dragging.", "Vertical touch scrolling still works over it."],
  },
  "scroll-float": {
    name: "Scroll Float",
    description: "Letters float up and un-squash as the text scrolls into view, tied to the scroll position.",
    importName: "ScrollFloat",
    importPath: "pleate/effects/scroll-float",
    demos: [{ id: "basic", title: "Scroll it into view", Component: ScrollFloatBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "as", type: "ElementType", default: '"h2"', description: "Element to render." },
      { name: "stagger", type: "number", default: "0.5", description: "Share of the scroll range over which letters start (0 to 1)." },
    ],
    a11y: ["Screen readers get the whole sentence once.", "Reduced motion shows the plain text."],
  },
  "scroll-velocity": {
    name: "Scroll Velocity",
    description: "Marquee rows that drift on their own and rush ahead when you scroll. Scrolling up turns them around; rows alternate direction.",
    importName: "ScrollVelocity",
    importPath: "pleate/effects/scroll-velocity",
    demos: [{ id: "basic", title: "Two rows", align: "stretch", Component: ScrollVelocityBasic }],
    props: [
      { name: "texts", type: "string[]", description: "One row per string." },
      { name: "velocity", type: "number", default: "40", description: "Resting speed, % of one copy per second." },
      { name: "boost", type: "number", default: "4", description: "How much scroll speed adds." },
      { name: "copies", type: "number", default: "6", description: "Copies per row; raise it for short text." },
      { name: "rowClassName", type: "string", description: "Classes for the text in each row." },
    ],
    a11y: ["Each row is read once; the copies are hidden.", "Reduced motion keeps the rows still."],
  },
  "echo-text": {
    name: "Echo Text",
    description: "Fading copies trail behind the text and breathe outward and back.",
    importName: "EchoText",
    importPath: "pleate/effects/echo-text",
    demos: [{ id: "basic", title: "Diagonal and sideways", Component: EchoTextBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "copies", type: "number", default: "4", description: "Trailing copies." },
      { name: "x / y", type: "number", default: "0.06 / 0.06", description: "Offset per copy, in em." },
      { name: "color", type: "string", default: "accent", description: "Color of the copies." },
      { name: "duration", type: "number", default: "2.4", description: "Seconds per pulse." },
    ],
    a11y: ["Copies are hidden from screen readers.", "Reduced motion leaves the copies at rest."],
  },
  "masked-heading": {
    name: "Masked Heading",
    description: "Each line slides up from behind an invisible edge when the heading comes into view, one line after another.",
    importName: "MaskedHeading",
    importPath: "pleate/effects/masked-heading",
    demos: [{ id: "basic", title: "Three lines", Component: MaskedHeadingBasic }],
    props: [
      { name: "lines", type: "string[]", description: "One entry per line, so the breaks are yours." },
      { name: "as", type: "ElementType", default: '"h2"', description: "Element to render." },
      { name: "stagger / delay / duration", type: "number", default: "0.12 / 0 / 0.9", description: "Timing in seconds." },
      { name: "once", type: "boolean", default: "true", description: "Play only the first time." },
    ],
    a11y: ["Screen readers get the lines joined as one sentence.", "Reduced motion shows it at rest."],
  },
  "split-flap-text": {
    name: "Split Flap Text",
    description: "A departures board: each tile flips through the alphabet until it lands on its letter. Change the text and it flips to the new one.",
    importName: "SplitFlapText",
    importPath: "pleate/effects/split-flap-text",
    demos: [{ id: "basic", title: "Departures", Component: SplitFlapTextBasic }],
    props: [
      { name: "text", type: "string", description: "Uppercased when every character is in the set." },
      { name: "characters", type: "string", default: '" A-Z 0-9 : . -"', description: "What the flaps cycle through, in order." },
      { name: "step", type: "number", default: "70", description: "Milliseconds per flip." },
      { name: "stagger", type: "number", default: "40", description: "Milliseconds between tiles." },
      { name: "tileClassName", type: "string", description: "Classes for each tile." },
    ],
    a11y: ["Screen readers get the final text once; the tiles are hidden.", "Reduced motion shows the final text."],
  },
  "stroke-text": {
    name: "Stroke Text",
    description: "The outline of each letter is drawn on, then the letters fill in. Scales with the surrounding font size.",
    importName: "StrokeText",
    importPath: "pleate/effects/stroke-text",
    demos: [{ id: "basic", title: "Filled and outline only", Component: StrokeTextBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "duration / delay", type: "number", default: "1.8 / 0", description: "Seconds to draw, and before starting." },
      { name: "stroke", type: "string", default: "accent", description: "Outline color." },
      { name: "fill", type: "string", default: "fg", description: 'Fill once drawn; "none" keeps the outline.' },
      { name: "strokeWidth", type: "number", default: "1.5", description: "In hundredths of the font size." },
    ],
    a11y: ["The drawing is hidden from screen readers; they get the text.", "Reduced motion shows the filled text."],
  },
  "tech-text": {
    name: "Tech Text",
    description: "A heads-up readout: monospace text types on behind a block cursor, the newest letters still decoding, inside bracket corners with a passing scanline.",
    importName: "TechText",
    importPath: "pleate/effects/tech-text",
    demos: [{ id: "basic", title: "Framed and bare", Component: TechTextBasic }],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "speed", type: "number", default: "40", description: "Milliseconds per character." },
      { name: "decode", type: "number", default: "3", description: "Newest characters still scrambled." },
      { name: "cursor", type: "boolean", default: "true", description: "Keep the cursor blinking after typing." },
      { name: "frame", type: "boolean", default: "true", description: "Bracket corners and scanline." },
      { name: "color", type: "string", default: "accent", description: "Corners, cursor and scanline." },
    ],
    a11y: ["Screen readers get the full text once, not the typing.", "Space for the full text is reserved, so nothing jumps.", "Reduced motion shows the final text without scanline or blink."],
  },
  "ascii-text": {
    name: "ASCII Text",
    description: "A word drawn as a grid of ASCII characters, with a slow wave running through it. Picks characters by brightness and colors them with the palette.",
    importName: "AsciiText",
    importPath: "pleate/effects/ascii-text",
    demos: [
      { id: "basic", title: "Waving", align: "stretch", Component: AsciiTextBasic },
      { id: "still", title: "Custom ramp, no wave", Component: AsciiTextStill },
    ],
    props: [
      { name: "text", type: "string", description: "The word to draw." },
      { name: "ramp", type: "string", default: '" .:-=+*#%@"', description: "Characters from empty to full." },
      { name: "cell", type: "number", default: "9", description: "Character size (px)." },
      { name: "amplitude", type: "number", default: "1.5", description: "Wave height in cells; 0 for none." },
      { name: "speed", type: "number", default: "1", description: "Wave speed." },
      { name: "color", type: "string", default: '"var(--pl-accent)"', description: "Character color." },
      { name: "font", type: "string", default: '"800 100px system-ui"', description: "Canvas font for the source letters." },
    ],
    a11y: ["The real text is in the page for screen readers; the characters are hidden.", "Reduced motion draws one still frame.", "Pauses when off screen."],
  },
  "particle-text": {
    name: "Particle Text",
    description: "Text made of dots that fly in to form the letters, scatter away from the pointer and spring back.",
    importName: "ParticleText",
    importPath: "pleate/effects/particle-text",
    demos: [
      { id: "basic", title: "Move across it", align: "stretch", Component: ParticleTextBasic },
      { id: "dense", title: "Denser, one color", align: "stretch", Component: ParticleTextDense },
    ],
    props: [
      { name: "text", type: "string", description: "The text to form." },
      { name: "height", type: "number", default: "220", description: "Canvas height (px)." },
      { name: "gap / size", type: "number", default: "4 / 1.6", description: "Distance between dots and dot radius (px)." },
      { name: "radius", type: "number", default: "80", description: "How far the pointer pushes (px)." },
      { name: "colors", type: "string[]", default: "fg, accent", description: "Dot colors; follow the palette by default." },
    ],
    a11y: ["The text is available to screen readers; the canvas is hidden.", "Reduced motion draws the settled letters once.", "Pauses when off screen."],
  },
  "falling-text": {
    name: "Falling Text",
    description: "Words drop out of a sentence and pile up at the bottom of the box. Pick them up and throw them. Starts on view, click or hover.",
    importName: "FallingText",
    importPath: "pleate/effects/falling-text",
    demos: [
      { id: "basic", title: "Falls on view", align: "stretch", Component: FallingTextBasic },
      { id: "click", title: "Falls on click", align: "stretch", Component: FallingTextClick },
    ],
    props: [
      { name: "text", type: "string", description: "The sentence." },
      { name: "trigger", type: '"view" | "click" | "hover"', default: '"view"', description: "What starts the fall." },
      { name: "highlightWords / highlightClassName", type: "string[] / string", default: '[] / "text-accent-ink"', description: "Words to color." },
      { name: "height", type: "number", default: "260", description: "Box height (px); the floor is its bottom." },
      { name: "wordClassName", type: "string", description: "Classes for every word, e.g. to make them pills." },
    ],
    a11y: ["Screen readers read the sentence once, in order.", "Reduced motion leaves the words in place.", "Words can be dragged with touch or mouse."],
  },
  "fuzzy-text": {
    name: "Fuzzy Text",
    description: "Text whose thin slices jitter sideways like a weak signal. The noise grows while the pointer is over it. Takes its font from your classes.",
    importName: "FuzzyText",
    importPath: "pleate/effects/fuzzy-text",
    demos: [
      { id: "basic", title: "Error page number", Component: FuzzyTextBasic },
      { id: "accent", title: "Accent, calm at rest", Component: FuzzyTextAccent },
    ],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "baseIntensity / hoverIntensity", type: "number", default: "0.15 / 0.5", description: "Jitter at rest and on hover, 0 to 1." },
      { name: "color", type: "string", default: '"var(--pl-fg)"', description: "Text color." },
      { name: "slice", type: "number", default: "2", description: "Slice height (px)." },
    ],
    a11y: ["The text is available to screen readers; the canvas is hidden.", "Reduced motion draws it clean.", "Pauses when off screen."],
  },
  "text-pressure": {
    name: "Text Pressure",
    description: "A heading that spans its container. Letters near the pointer get heavier and taller, like pressing into the type. Needs a variable weight font such as Geist.",
    importName: "TextPressure",
    importPath: "pleate/effects/text-pressure",
    demos: [
      { id: "basic", title: "Weight and stretch", align: "stretch", Component: TextPressureBasic },
      { id: "alpha", title: "Weight and fade", align: "stretch", Component: TextPressureAlpha },
    ],
    props: [
      { name: "text", type: "string", description: "The heading." },
      { name: "minWeight / maxWeight", type: "number", default: "200 / 900", description: "Weight far away and under the pointer." },
      { name: "stretch", type: "boolean", default: "true", description: "Letters grow taller near the pointer." },
      { name: "alpha", type: "boolean", default: "false", description: "Letters fade far from the pointer." },
    ],
    a11y: ["Screen readers get the plain text.", "Touch screens and reduced motion show a steady middle weight."],
  },
  "variable-proximity": {
    name: "Variable Proximity",
    description: "Letters near the pointer gain weight and settle back with distance. Works in running text and wraps normally. Needs a variable weight font such as Geist.",
    importName: "VariableProximity",
    importPath: "pleate/effects/variable-proximity",
    demos: [
      { id: "basic", title: "Linear", Component: VariableProximityBasic },
      { id: "gaussian", title: "Gaussian, wider reach", Component: VariableProximityGaussian },
    ],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "fromWeight / toWeight", type: "number", default: "400 / 900", description: "Base weight and weight under the pointer." },
      { name: "radius", type: "number", default: "90", description: "Reach (px)." },
      { name: "falloff", type: '"linear" | "exponential" | "gaussian"', default: '"linear"', description: "How weight drops with distance." },
    ],
    a11y: ["Screen readers get the plain text.", "Touch screens and reduced motion keep the base weight."],
  },
  "warp-text": {
    name: "Warp Text",
    description: "Letters ride a travelling wave, lifting and leaning as it passes. The wave grows around the pointer.",
    importName: "WarpText",
    importPath: "pleate/effects/warp-text",
    demos: [
      { id: "basic", title: "Gentle", Component: WarpTextBasic },
      { id: "strong", title: "Short, fast wave", Component: WarpTextStrong },
    ],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "amplitude / pointerAmplitude", type: "number", default: "0.08 / 0.25", description: "Wave height at rest and extra near the pointer (em)." },
      { name: "wavelength", type: "number", default: "10", description: "Letters per wave." },
      { name: "speed", type: "number", default: "0.6", description: "Waves per second." },
      { name: "skew", type: "number", default: "10", description: "Maximum lean (deg)." },
    ],
    a11y: ["Screen readers get the plain text.", "Reduced motion keeps the letters still.", "Pauses when off screen."],
  },
  "depth-text": {
    name: "Depth Text",
    description: "A heading extruded into 3D with stacked layers. It tilts toward the pointer so the sides show.",
    importName: "DepthText",
    importPath: "pleate/effects/depth-text",
    demos: [
      { id: "basic", title: "Accent sides", Component: DepthTextBasic },
      { id: "mono", title: "Accent face, muted sides", Component: DepthTextMono },
    ],
    props: [
      { name: "text", type: "string", description: "The heading." },
      { name: "layers / step", type: "number", default: "12 / 1.5", description: "Layers behind the front and distance between them (px)." },
      { name: "tilt", type: "number", default: "20", description: "Maximum tilt (deg)." },
      { name: "color / depthColor", type: "string", default: "fg / accent", description: "Front face and side colors." },
    ],
    a11y: ["The front layer is the real text; the copies are hidden.", "Touch screens and reduced motion keep a fixed slight angle."],
  },
  "fold-text": {
    name: "Fold Text",
    description: "Each letter is paper folded along its middle. The halves open flat one by one on view, or crease back on hover.",
    importName: "FoldText",
    importPath: "pleate/effects/fold-text",
    demos: [
      { id: "basic", title: "Unfolds on view", Component: FoldTextBasic },
      { id: "hover", title: "Creases on hover", Component: FoldTextHover },
    ],
    props: [
      { name: "text", type: "string", description: "The text." },
      { name: "trigger", type: '"view" | "hover"', default: '"view"', description: "Unfold once on view, or fold while hovered." },
      { name: "stagger", type: "number", default: "0.04", description: "Seconds between letters." },
      { name: "angle", type: "number", default: "70", description: "Fold angle on hover (deg)." },
    ],
    a11y: ["Screen readers get the plain text.", "Reduced motion shows the text flat."],
  },
};
