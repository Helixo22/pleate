// Component pages for the React Bits inspired set (animations-b). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import ImageTrailBasic from "../image-trail/basic";
import LaserFlowBasic from "../laser-flow/basic";
import MetaBallsBasic from "../meta-balls/basic";
import MetallicPaintBasic from "../metallic-paint/basic";
import NoiseBasic from "../noise/basic";
import OrbitImagesBasic from "../orbit-images/basic";
import PixelSwapBasic from "../pixel-swap/basic";
import PixelTrailBasic from "../pixel-trail/basic";
import PixelTransitionBasic from "../pixel-transition/basic";
import RibbonsBasic from "../ribbons/basic";
import RippleDistortionBasic from "../ripple-distortion/basic";
import ScrollExpandBasic from "../scroll-expand/basic";
import ShapeBlurBasic from "../shape-blur/basic";
import SplashCursorBasic from "../splash-cursor/basic";
import StarBorderBasic from "../star-border/basic";
import StickerPeelBasic from "../sticker-peel/basic";
import StrandsBasic from "../strands/basic";
import SwarmCursorBasic from "../swarm-cursor/basic";
import TargetCursorBasic from "../target-cursor/basic";

export const DOCS_ANIMATIONS_B: Record<string, ComponentDoc> = {
  "image-trail": {
    name: "Image Trail",
    description: "Images pop in along the cursor path and fade away. Stays inside its box unless fullPage is set; touch screens get the plain content.",
    importName: "ImageTrail",
    importPath: "pleate/effects/image-trail",
    demos: [{ id: "basic", title: "Trail", description: "Move the pointer across the box.", align: "stretch", Component: ImageTrailBasic }],
    props: [
      { name: "images", type: "string[]", description: 'Image URLs, used in turn.' },
      { name: "threshold", type: "number", default: '80', description: 'Pointer travel between two images (px).' },
      { name: "size", type: "number", default: '160', description: 'Image width (px).' },
      { name: "duration", type: "number", default: '900', description: 'Lifetime of one image (ms).' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Trail images are decorative (empty alt, aria-hidden layer).", "Off for touch and reduced motion; the system cursor stays."],
  },
  "laser-flow": {
    name: "Laser Flow",
    description: "A beam of light falls from the top and spills a glowing fog where it hits the floor. WebGL2, follows the accent color.",
    importName: "LaserFlow",
    importPath: "pleate/effects/laser-flow",
    demos: [{ id: "basic", title: "Beam", align: "stretch", Component: LaserFlowBasic }],
    props: [
      { name: "color", type: "string", default: 'accent', description: 'Beam color, tokens allowed.' },
      { name: "x", type: "number", default: '0.5', description: 'Beam position across, 0 to 1.' },
      { name: "floor", type: "number", default: '0.25', description: 'Height of the floor it hits, 0 to 1.' },
      { name: "fog", type: "number", default: '1', description: 'Amount of fog.' },
      { name: "speed", type: "number", default: '1', description: 'Playback speed.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Reduced motion shows one still frame."],
  },
  "meta-balls": {
    name: "Meta Balls",
    description: "Liquid blobs drift, merge and split. One more blob follows the pointer and melts into the rest.",
    importName: "MetaBalls",
    importPath: "pleate/effects/meta-balls",
    demos: [{ id: "basic", title: "Blobs", align: "stretch", Component: MetaBallsBasic }],
    props: [
      { name: "color", type: "string", default: 'accent', description: 'Blob color.' },
      { name: "count", type: "number", default: '7', description: 'Drifting blobs, 1 to 12.' },
      { name: "size", type: "number", default: '0.09', description: 'Blob radius relative to the height.' },
      { name: "followPointer", type: "boolean", default: 'true', description: 'Add a blob on the pointer.' },
      { name: "speed", type: "number", default: '1', description: 'Playback speed.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Reduced motion shows one still frame."],
  },
  "metallic-paint": {
    name: "Metallic Paint",
    description: "Liquid chrome flowing inside a shape. Pass any image with transparency, such as an SVG logo; its alpha is the mask.",
    importName: "MetallicPaint",
    importPath: "pleate/effects/metallic-paint",
    demos: [{ id: "basic", title: "Shapes", description: "Inline SVG shapes as data URLs. The ring is tinted with the accent.", align: "center", Component: MetallicPaintBasic }],
    props: [
      { name: "src", type: "string", description: 'Shape image URL. Only its alpha is used.' },
      { name: "alt", type: "string", description: 'Accessible name; leave empty when decorative.' },
      { name: "tint", type: "string", default: 'accent', description: 'Color mixed into the metal.' },
      { name: "scale", type: "number", default: '1', description: 'Size of the bands.' },
      { name: "speed", type: "number", default: '1', description: 'Playback speed.' },
    ],
    a11y: ["With alt it is role=img with that label; without, it is hidden from assistive tech.", "Reduced motion shows one still frame."],
  },
  "noise": {
    name: "Noise",
    description: "Animated film grain laid over its parent. One small tile, shifted every few frames, so it stays cheap at any size.",
    importName: "Noise",
    importPath: "pleate/effects/noise",
    demos: [{ id: "basic", title: "Grain", align: "stretch", Component: NoiseBasic }],
    props: [
      { name: "opacity", type: "number", default: '0.12', description: 'Grain strength.' },
      { name: "grainSize", type: "number", default: '1.5', description: 'Size of one grain (px).' },
      { name: "refreshInterval", type: "number", default: '2', description: 'Frames between two patterns.' },
      { name: "blend", type: "mix-blend-mode", default: '"normal"', description: 'Blend with the content.' },
    ],
    a11y: ["Decorative and click-through (aria-hidden).", "Reduced motion keeps one still grain."],
  },
  "orbit-images": {
    name: "Orbit Images",
    description: "Images circle a center on a tilted ring. The ones in front grow and sit on top, the ones behind shrink and dim.",
    importName: "OrbitImages",
    importPath: "pleate/effects/orbit-images",
    demos: [{ id: "basic", title: "Ring", description: "Hover to pause.", align: "center", Component: OrbitImagesBasic }],
    props: [
      { name: "images", type: "{ src, alt }[]", description: 'Images on the ring.' },
      { name: "radius", type: "number", default: '140', description: 'Ring radius (px).' },
      { name: "tilt", type: "number", default: '0.35', description: 'Vertical squash, 0 to 1.' },
      { name: "itemSize", type: "number", default: '64', description: 'Image size (px).' },
      { name: "duration", type: "number", default: '24', description: 'Seconds per turn; negative reverses.' },
      { name: "pauseOnHover", type: "boolean", default: 'true', description: 'Stop under the pointer.' },
      { name: "children", type: "ReactNode", description: 'Content in the middle.' },
    ],
    a11y: ["Every image keeps its alt text.", "Reduced motion keeps the ring still."],
  },
  "pixel-swap": {
    name: "Pixel Swap",
    description: "On hover an image builds in block by block, in a springy wave that starts where the pointer came in.",
    importName: "PixelSwap",
    importPath: "pleate/effects/pixel-swap",
    demos: [{ id: "basic", title: "Reveal", align: "center", Component: PixelSwapBasic }],
    props: [
      { name: "src", type: "string", description: 'Image that builds in.' },
      { name: "alt", type: "string", description: 'Description of the image.' },
      { name: "columns", type: "number", default: '14', description: 'Blocks across.' },
      { name: "duration", type: "number", default: '420', description: 'Time one block takes (ms).' },
      { name: "spread", type: "number", default: '420', description: 'Time the wave takes to cross (ms).' },
    ],
    a11y: ["The image layer is role=img with the alt text.", "Focus inside starts the swap from the center.", "Reduced motion swaps with a fade."],
  },
  "pixel-trail": {
    name: "Pixel Trail",
    description: "Square pixels light up under the cursor and fade out behind it. Stays inside its box unless fullPage is set.",
    importName: "PixelTrail",
    importPath: "pleate/effects/pixel-trail",
    demos: [{ id: "basic", title: "Trail", align: "stretch", Component: PixelTrailBasic }],
    props: [
      { name: "gridSize", type: "number", default: '24', description: 'Pixel size (px).' },
      { name: "duration", type: "number", default: '600', description: 'Fade time (ms).' },
      { name: "color", type: "string", default: 'accent', description: 'Pixel color.' },
      { name: "roundness", type: "number", default: '0.15', description: 'Corner radius, 0 to 0.5.' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Off for touch and reduced motion; the system cursor stays."],
  },
  "pixel-transition": {
    name: "Pixel Transition",
    description: "A card that swaps between two faces behind a curtain of solid pixels. Hover, focus or tap.",
    importName: "PixelTransition",
    importPath: "pleate/effects/pixel-transition",
    demos: [{ id: "basic", title: "Card", description: "Hover the photo, or tap it on a touch screen.", align: "center", Component: PixelTransitionBasic }],
    props: [
      { name: "first", type: "ReactNode", description: 'Face at rest.' },
      { name: "second", type: "ReactNode", description: 'Face after the swap.' },
      { name: "grid", type: "number", default: '9', description: 'Pixels across.' },
      { name: "pixelColor", type: "string", default: 'var(--pl-fg)', description: 'Curtain color.' },
      { name: "duration", type: "number", default: '500', description: 'Time of one swap (ms).' },
    ],
    a11y: ["The hidden face is inert.", "Reduced motion swaps without the curtain."],
  },
  "ribbons": {
    name: "Ribbons",
    description: "Soft ribbons chase the cursor on springs, each a little slower, tapering towards the tail.",
    importName: "Ribbons",
    importPath: "pleate/effects/ribbons",
    demos: [{ id: "basic", title: "Ribbons", align: "stretch", Component: RibbonsBasic }],
    props: [
      { name: "colors", type: "string[]", default: 'accent, muted, fg', description: 'One ribbon per color.' },
      { name: "thickness", type: "number", default: '18', description: 'Head width (px).' },
      { name: "length", type: "number", default: '36', description: 'Points per ribbon.' },
      { name: "ease", type: "number", default: '0.18', description: 'How quickly the head catches up.' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Off for touch and reduced motion; the system cursor stays."],
  },
  "ripple-distortion": {
    name: "Ripple Distortion",
    description: "An image that ripples like water under the cursor. An SVG filter, so any image works, cross origin included.",
    importName: "RippleDistortion",
    importPath: "pleate/effects/ripple-distortion",
    demos: [{ id: "basic", title: "Water", description: "Move the pointer over the photo.", align: "stretch", Component: RippleDistortionBasic }],
    props: [
      { name: "src", type: "string", description: 'Image URL.' },
      { name: "alt", type: "string", description: 'Description of the image.' },
      { name: "strength", type: "number", default: '28', description: 'How far pixels get pushed (px).' },
      { name: "radius", type: "number", default: '140', description: 'Ripple radius (px).' },
    ],
    a11y: ["A plain img with its alt text.", "Touch and reduced motion show the still image."],
  },
  "scroll-expand": {
    name: "Scroll Expand",
    description: "A rounded media frame that opens to full bleed as it scrolls into the middle of the viewport.",
    importName: "ScrollExpand",
    importPath: "pleate/effects/scroll-expand",
    demos: [{ id: "basic", title: "Expand", description: "Scroll the page.", align: "stretch", Component: ScrollExpandBasic }],
    props: [
      { name: "children", type: "ReactNode", description: 'The media.' },
      { name: "startInset", type: "number", default: '18', description: 'Inset per side at the start (% of width).' },
      { name: "startRadius", type: "number", default: '32', description: 'Corner radius at the start (px).' },
      { name: "startZoom", type: "number", default: '1.15', description: 'Media zoom at the start.' },
    ],
    a11y: ["Reduced motion shows the frame fully open."],
  },
  "shape-blur": {
    name: "Shape Blur",
    description: "A crisp shape or logo that drifts out of focus under the pointer, like a lens with a shallow depth of field.",
    importName: "ShapeBlur",
    importPath: "pleate/effects/shape-blur",
    demos: [{ id: "basic", title: "Lens", description: "Move the pointer over the logo.", align: "center", Component: ShapeBlurBasic }],
    props: [
      { name: "blur", type: "number", default: '10', description: 'Blur at the lens center (px).' },
      { name: "radius", type: "number", default: '110', description: 'Lens radius (px).' },
      { name: "children", type: "ReactNode", description: 'The shape.' },
    ],
    a11y: ["The blurred copy is aria-hidden and inert.", "Off for touch and reduced motion."],
  },
  "splash-cursor": {
    name: "Splash Cursor",
    description: "Moving the cursor stirs up clouds of color that swirl, spread and fade, like dye in water. Stays inside its box unless fullPage is set.",
    importName: "SplashCursor",
    importPath: "pleate/effects/splash-cursor",
    demos: [{ id: "basic", title: "Splash", align: "stretch", Component: SplashCursorBasic }],
    props: [
      { name: "colors", type: "string[]", default: 'rainbow', description: 'Dye colors; empty for a shifting rainbow.' },
      { name: "size", type: "number", default: '1', description: 'Puff size.' },
      { name: "lifetime", type: "number", default: '1.6', description: 'Seconds the dye lasts.' },
      { name: "blur", type: "number", default: '10', description: 'Softness (px).' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Off for touch and reduced motion; the system cursor stays."],
  },
  "star-border": {
    name: "Star Border",
    description: "A thin border with a point of light running around it. A button by default, any element with as.",
    importName: "StarBorder",
    importPath: "pleate/effects/star-border",
    demos: [{ id: "basic", title: "Buttons", align: "center", Component: StarBorderBasic }],
    props: [
      { name: "as", type: "ElementType", default: '"button"', description: 'Element to render.' },
      { name: "color", type: "string", default: 'accent', description: 'Light color.' },
      { name: "speed", type: "number", default: '4', description: 'Seconds per lap.' },
      { name: "thickness", type: "number", default: '1.5', description: 'Border width (px).' },
    ],
    a11y: ["A real button or link with the usual focus ring.", "Reduced motion keeps the light still."],
  },
  "sticker-peel": {
    name: "Sticker Peel",
    description: "A sticker you can drag around. Hover lifts its corner into a curl that shows the backing.",
    importName: "StickerPeel",
    importPath: "pleate/effects/sticker-peel",
    demos: [{ id: "basic", title: "Stickers", description: "Drag them, hover to peel.", align: "stretch", Component: StickerPeelBasic }],
    props: [
      { name: "children", type: "ReactNode", description: 'The sticker face.' },
      { name: "width", type: "number", default: '180', description: 'Width (px).' },
      { name: "peel", type: "number", default: '0.28', description: 'Corner lift on hover, fraction of width.' },
      { name: "rotate", type: "number", default: '-6', description: 'Starting rotation (deg).' },
      { name: "backColor", type: "string", default: '#e9e9ee', description: 'Backing color.' },
      { name: "dragConstraints", type: "RefObject", description: 'Box that bounds dragging.' },
    ],
    a11y: ["Give the face its own label (img alt or an SVG with aria-label).", "Dragging is pointer only.", "Reduced motion keeps the corner down."],
  },
  "strands": {
    name: "Strands",
    description: "Strands of light twist inside a frosted glass orb and swell where they meet, like a voice assistant listening.",
    importName: "Strands",
    importPath: "pleate/effects/strands",
    demos: [{ id: "basic", title: "Orbs", description: "Spectral, and tinted with the accent.", align: "center", Component: StrandsBasic }],
    props: [
      { name: "count", type: "number", default: '5', description: 'Strands, 1 to 8.' },
      { name: "spectral", type: "boolean", default: 'true', description: 'Rainbow strands, or tints of color.' },
      { name: "color", type: "string", default: 'accent', description: 'Base color when not spectral.' },
      { name: "amplitude", type: "number", default: '0.8', description: 'How far strands swing apart.' },
      { name: "speed", type: "number", default: '1', description: 'Playback speed.' },
    ],
    a11y: ["Decorative (aria-hidden).", "Reduced motion shows one still frame."],
  },
  "swarm-cursor": {
    name: "Swarm Cursor",
    description: "A cloud of particles flocks after the cursor and drifts around it when it stops. Stays inside its box unless fullPage is set.",
    importName: "SwarmCursor",
    importPath: "pleate/effects/swarm-cursor",
    demos: [{ id: "basic", title: "Swarm", align: "stretch", Component: SwarmCursorBasic }],
    props: [
      { name: "count", type: "number", default: '60', description: 'Particles.' },
      { name: "color", type: "string", default: 'accent', description: 'Particle color.' },
      { name: "size", type: "number", default: '2.5', description: 'Particle radius (px).' },
      { name: "attraction", type: "number", default: '1', description: 'Pull towards the cursor.' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Decorative canvas (aria-hidden).", "Off for touch and reduced motion; the system cursor stays."],
  },
  "target-cursor": {
    name: "Target Cursor",
    description: "Corner brackets ring the cursor and spin; over a marked element they lock onto its edges. The system cursor stays visible.",
    importName: "TargetCursor",
    importPath: "pleate/effects/target-cursor",
    demos: [{ id: "basic", title: "Targets", description: "Mark elements with data-cursor-target.", align: "stretch", Component: TargetCursorBasic }],
    props: [
      { name: "targetSelector", type: "string", default: '"[data-cursor-target]"', description: 'Elements to lock onto.' },
      { name: "size", type: "number", default: '36', description: 'Idle reticle size (px).' },
      { name: "spinDuration", type: "number", default: '3', description: 'Seconds per turn; 0 stops it.' },
      { name: "color", type: "string", default: 'accent', description: 'Bracket color.' },
      { name: "fullPage", type: "boolean", default: 'false', description: 'Follow the pointer over the whole page.' },
    ],
    a11y: ["Decorative layer (aria-hidden).", "Off for touch and reduced motion."],
  },
};
