// Component pages for the React Bits inspired set (components-b). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import GlassIconsBasic from "../glass-icons/basic";
import GlassSurfaceBasic from "../glass-surface/basic";
import GooeyNavBasic from "../gooey-nav/basic";
import HoloCardBasic from "../holo-card/basic";
import InfiniteMenuBasic from "../infinite-menu/basic";
import InfiniteSpiralBasic from "../infinite-spiral/basic";
import LanyardBasic from "../lanyard/basic";
import LineSidebarBasic from "../line-sidebar/basic";
import MagicBentoBasic from "../magic-bento/basic";
import MasonryBasic from "../masonry/basic";
import MorphSliderBasic from "../morph-slider/basic";
import OptionWheelBasic from "../option-wheel/basic";
import PillNavBasic from "../pill-nav/basic";
import PixelCardBasic from "../pixel-card/basic";
import ProfileCardBasic from "../profile-card/basic";
import ReflectiveCardBasic from "../reflective-card/basic";
import ScrollStackBasic from "../scroll-stack/basic";
import SpecularButtonBasic from "../specular-button/basic";
import SpotlightCardBasic from "../spotlight-card/basic";
import SwipeStackBasic from "../swipe-stack/basic";
import StaggeredMenuBasic from "../staggered-menu/basic";
import StepFlowBasic from "../step-flow/basic";
import TiltedCardBasic from "../tilted-card/basic";

export const DOCS_COMPONENTS_B: Record<string, ComponentDoc> = {
  "glass-icons": {
    name: "Glass Icons",
    description: "App style icon tiles: a colored tile tilts behind a frosted glass one and swings out on hover or focus, with the label sliding in.",
    importName: "GlassIcons",
    importPath: "pleate/effects/glass-icons",
    demos: [{ id: "basic", title: "Six apps", align: "center", Component: GlassIconsBasic }],
    props: [
      { name: "items", type: "GlassIconItem[]", description: "icon, label, color, href or onClick." },
    ],
    a11y: ["Each tile is a button, or a link with href; the label is its name.", "Touch screens always show the labels."],
  },
  "glass-surface": {
    name: "Glass Surface",
    description: "A frosted liquid glass panel: blurred, saturated backdrop with a light catching rim. On Chromium the edges bend the backdrop like a thick lens.",
    importName: "GlassSurface",
    importPath: "pleate/effects/glass-surface",
    demos: [{ id: "basic", title: "Player on a photo", align: "stretch", Component: GlassSurfaceBasic }],
    props: [
      { name: "blur", type: "number", default: "14", description: "Backdrop blur (px)." },
      { name: "saturation", type: "number", default: "1.8", description: "Backdrop saturation." },
      { name: "refraction", type: "number", default: "40", description: "Edge bend (px); 0 turns it off." },
      { name: "tint", type: "string", default: "surface at 35%", description: "Glass tint color." },
    ],
    a11y: ["Decorative only: content inside keeps its own semantics.", "Browsers without SVG backdrop filters get plain frosted glass."],
  },
  "gooey-nav": {
    name: "Gooey Nav",
    description: "A nav row where the active pill flows to the chosen item through a goo filter, shedding droplets that melt back in.",
    importName: "GooeyNav",
    importPath: "pleate/effects/gooey-nav",
    demos: [{ id: "basic", title: "Five items", align: "center", Component: GooeyNavBasic }],
    props: [
      { name: "items", type: "{ label, href? }[]", description: "Links or buttons." },
      { name: "value / defaultValue", type: "number", default: "0", description: "Active index." },
      { name: "onChange", type: "(index) => void", description: "Called on select." },
      { name: "particleCount", type: "number", default: "12", description: "Droplets per change." },
      { name: "color", type: "string", default: "accent", description: "Pill color." },
    ],
    a11y: ["A nav landmark; the active item has aria-current=\"page\".", "Left and right arrows move focus between items.", "Reduced motion moves the pill without droplets."],
  },
  "holo-card": {
    name: "Holo Card",
    description: "A collectible card with holographic foil and glitter that shift as it tilts toward the pointer.",
    importName: "HoloCard",
    importPath: "pleate/effects/holo-card",
    demos: [{ id: "basic", title: "Trading card", align: "center", Component: HoloCardBasic }],
    props: [
      { name: "maxTilt", type: "number", default: "14", description: "Maximum tilt (deg)." },
      { name: "intensity", type: "number", default: "0.6", description: "Foil strength, 0 to 1." },
      { name: "children", type: "ReactNode", description: "Card face." },
    ],
    a11y: ["Foil layers are aria-hidden; the content stays plain markup.", "Reduced motion keeps a still, lightly lit foil."],
  },
  "infinite-menu": {
    name: "Infinite Menu",
    description: "Items on a sphere you spin by dragging. It coasts, then the nearest disc swings to the front and its title shows below.",
    importName: "InfiniteMenu",
    importPath: "pleate/effects/infinite-menu",
    demos: [{ id: "basic", title: "Places", align: "stretch", Component: InfiniteMenuBasic }],
    props: [
      { name: "items", type: "{ image, title, description?, href? }[]", description: "Discs; they repeat to fill the sphere." },
      { name: "count", type: "number", default: "30", description: "Discs on the sphere." },
      { name: "onSelect", type: "(item) => void", description: "Front item button or Enter." },
    ],
    a11y: ["The sphere is a focusable group: arrow keys hop to the neighbor in that direction, Enter opens the front item.", "The front title is announced through a polite live region.", "Reduced motion snaps without coasting."],
  },
  "infinite-spiral": {
    name: "Infinite Spiral",
    description: "An endless 3D helix of images that climbs and turns on its own. Drag or use the arrow keys to push it.",
    importName: "InfiniteSpiral",
    importPath: "pleate/effects/infinite-spiral",
    demos: [{ id: "basic", title: "Photo helix", align: "stretch", Component: InfiniteSpiralBasic }],
    props: [
      { name: "items", type: "{ src, alt }[]", description: "Images." },
      { name: "radius", type: "number", default: "220", description: "Helix radius (px)." },
      { name: "spacing", type: "number", default: "44", description: "Vertical gap (px)." },
      { name: "perTurn", type: "number", default: "8", description: "Items per turn." },
      { name: "speed", type: "number", default: "0.35", description: "Items per second." },
      { name: "cardWidth", type: "number", default: "150", description: "Card width (px)." },
    ],
    a11y: ["Hover or focus pauses it; arrow keys turn it.", "Reduced motion keeps it still."],
  },
  "lanyard": {
    name: "Lanyard",
    description: "A badge hanging from a strap with a small verlet rope simulation. Grab and throw it, or swing it with the arrow keys.",
    importName: "Lanyard",
    importPath: "pleate/effects/lanyard",
    demos: [{ id: "basic", title: "Conference badge", align: "center", Component: LanyardBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "Badge content." },
      { name: "label", type: "string", default: "\"Badge\"", description: "Accessible name." },
      { name: "length", type: "number", default: "190", description: "Strap length (px)." },
      { name: "width / height", type: "number", default: "210 / 290", description: "Badge size (px)." },
      { name: "strapColor", type: "string", default: "accent", description: "Strap color." },
    ],
    a11y: ["The badge is focusable; arrow keys give it a swing.", "The simulation sleeps at rest; reduced motion shows it hanging still."],
  },
  "line-sidebar": {
    name: "Line Sidebar",
    description: "A quiet list nav: items near the pointer lean out, their lines grow and the text brightens.",
    importName: "LineSidebar",
    importPath: "pleate/effects/line-sidebar",
    demos: [{ id: "basic", title: "Docs sections", align: "center", Component: LineSidebarBasic }],
    props: [
      { name: "items", type: "{ label, href? }[]", description: "Links or buttons." },
      { name: "value / defaultValue", type: "number", default: "0", description: "Current index." },
      { name: "onChange", type: "(index) => void", description: "Called on select." },
      { name: "range", type: "number", default: "90", description: "Pointer reach (px)." },
    ],
    a11y: ["A nav landmark with aria-current on the current item.", "Keyboard focus gets the full effect."],
  },
  "magic-bento": {
    name: "Magic Bento",
    description: "A bento grid whose card borders glow around the pointer, even from a neighbor card, with a soft spotlight inside and optional tilt.",
    importName: "MagicBento, MagicBentoCard",
    importPath: "pleate/effects/magic-bento",
    demos: [{ id: "basic", title: "Feature grid", align: "stretch", Component: MagicBentoBasic }],
    props: [
      { name: "glowRadius", type: "number", default: "260", description: "Glow radius (px)." },
      { name: "glowColor", type: "string", default: "accent", description: "Glow color." },
      { name: "tilt", type: "number", default: "0", description: "Card tilt (deg), 0 is off." },
      { name: "MagicBentoCard", type: "div props", description: "Use col-span and row-span classes for shape." },
    ],
    a11y: ["Glow layers are decorative.", "Touch screens and reduced motion get plain cards."],
  },
  "masonry": {
    name: "Masonry",
    description: "An image wall packed into the shortest column. It reflows smoothly on resize and items rise in one after another on first view.",
    importName: "Masonry",
    importPath: "pleate/effects/masonry",
    demos: [{ id: "basic", title: "Gallery", align: "stretch", Component: MasonryBasic }],
    props: [
      { name: "items", type: "{ id, src, alt, ratio, href? }[]", description: "ratio is height over width." },
      { name: "breakpoints", type: "[minWidth, columns][]", default: "900:4, 600:3, 0:2", description: "Columns by container width." },
      { name: "gap", type: "number", default: "12", description: "Gap (px)." },
      { name: "stagger", type: "number", default: "0.05", description: "Delay between items (s)." },
    ],
    a11y: ["Items with href are links; the rest are figures with alt text.", "Reduced motion places everything at once."],
  },
  "morph-slider": {
    name: "Morph Slider",
    description: "An image slider that melts from one picture to the next with a WebGL2 displacement transition.",
    importName: "MorphSlider",
    importPath: "pleate/effects/morph-slider",
    demos: [{ id: "basic", title: "Landscapes", align: "center", Component: MorphSliderBasic }],
    props: [
      { name: "slides", type: "{ src, alt }[]", description: "Images (must allow CORS)." },
      { name: "duration", type: "number", default: "1200", description: "Transition (ms)." },
      { name: "strength", type: "number", default: "0.2", description: "Melt strength." },
      { name: "autoplay", type: "number", default: "0", description: "Advance every N ms; 0 is off." },
    ],
    a11y: ["A carousel region with prev, next and dot buttons; left and right arrows work inside it.", "The current slide is announced politely; autoplay pauses on hover and focus.", "Without WebGL2 or with reduced motion it crossfades plain images."],
  },
  "option-wheel": {
    name: "Option Wheel",
    description: "An iOS style picker drum. Scroll, drag or use the arrow keys; rows tilt away from the center and it settles on the nearest one.",
    importName: "OptionWheel",
    importPath: "pleate/effects/option-wheel",
    demos: [{ id: "basic", title: "City picker", align: "center", Component: OptionWheelBasic }],
    props: [
      { name: "options", type: "string[]", description: "Rows." },
      { name: "value / defaultValue", type: "number", default: "0", description: "Selected index." },
      { name: "onChange", type: "(index) => void", description: "Called when it settles." },
      { name: "itemHeight", type: "number", default: "40", description: "Row height (px)." },
      { name: "visible", type: "number", default: "3", description: "Rows above and below center." },
    ],
    a11y: ["A listbox with aria-activedescendant on the centered option.", "Up, Down, Page Up, Page Down, Home and End move the selection."],
  },
  "pill-nav": {
    name: "Pill Nav",
    description: "A capsule nav bar: hovering floods a pill from below while its label rolls up. Folds into a menu button on narrow screens.",
    importName: "PillNav",
    importPath: "pleate/effects/pill-nav",
    demos: [{ id: "basic", title: "Site nav", align: "center", Component: PillNavBasic }],
    props: [
      { name: "items", type: "{ label, href }[]", description: "Links." },
      { name: "activeHref", type: "string", description: "Current page." },
      { name: "logo", type: "ReactNode", description: "Round logo pill." },
      { name: "logoHref / logoLabel", type: "string", default: "\"/\" / \"Home\"", description: "Logo link and name." },
    ],
    a11y: ["A nav landmark with aria-current on the current link.", "The mobile toggle has aria-expanded and closes on Escape."],
  },
  "pixel-card": {
    name: "Pixel Card",
    description: "A card that fills with shimmering pixels from the center outward when hovered or focused, and drains on leave.",
    importName: "PixelCard",
    importPath: "pleate/effects/pixel-card",
    demos: [{ id: "basic", title: "Default and warm", align: "stretch", Component: PixelCardBasic }],
    props: [
      { name: "gap", type: "number", default: "6", description: "Pixel spacing (px)." },
      { name: "speed", type: "number", default: "0.4", description: "Wave speed, 0 to 1." },
      { name: "colors", type: "string[]", default: "accent tones", description: "Pixel colors." },
    ],
    a11y: ["The canvas is aria-hidden; focus triggers it too.", "Reduced motion shows no pixels."],
  },
  "profile-card": {
    name: "Profile Card",
    description: "A tall profile card that tilts with an iridescent sheen, with a glass bar for handle, status and a contact button.",
    importName: "ProfileCard",
    importPath: "pleate/effects/profile-card",
    demos: [{ id: "basic", title: "Designer", align: "center", Component: ProfileCardBasic }],
    props: [
      { name: "name / title / handle / status", type: "string", description: "Text." },
      { name: "avatarUrl / avatarAlt", type: "string", description: "Portrait." },
      { name: "contactLabel / onContact", type: "string / () => void", default: "\"Contact\"", description: "Button." },
      { name: "maxTilt", type: "number", default: "10", description: "Tilt (deg)." },
      { name: "color", type: "string", default: "accent", description: "Backdrop color." },
    ],
    a11y: ["The sheen is aria-hidden; the contact action is a real button.", "Touch and reduced motion keep it flat."],
  },
  "reflective-card": {
    name: "Reflective Card",
    description: "A brushed metal ID card: a light band sweeps across as it tilts, and the reflected room shifts the other way. Optionally reflects a looping video.",
    importName: "ReflectiveCard",
    importPath: "pleate/effects/reflective-card",
    demos: [{ id: "basic", title: "Silver and graphite", align: "stretch", Component: ReflectiveCardBasic }],
    props: [
      { name: "metal", type: "\"silver\" | \"graphite\" | \"gold\"", default: "\"silver\"", description: "Metal tone." },
      { name: "reflection", type: "string", description: "Muted looping video URL to reflect." },
      { name: "maxTilt", type: "number", default: "12", description: "Tilt (deg)." },
    ],
    a11y: ["Reflection layers are aria-hidden.", "Reduced motion keeps it still and does not autoplay the video."],
  },
  "scroll-stack": {
    name: "Scroll Stack",
    description: "Cards that stick and pile up as you scroll, each shrinking back as the next slides over it.",
    importName: "ScrollStack, ScrollStackCard",
    importPath: "pleate/effects/scroll-stack",
    demos: [{ id: "basic", title: "Process", align: "center", Component: ScrollStackBasic }],
    props: [
      { name: "top", type: "number", default: "24", description: "First card offset (px)." },
      { name: "offset", type: "number", default: "14", description: "Extra offset per card (px)." },
      { name: "shrink", type: "number", default: "0.04", description: "Scale lost per covering card." },
    ],
    a11y: ["Scrolls in its own focusable region, so keyboard scrolling works.", "Reduced motion keeps sticking without scaling."],
  },
  "specular-button": {
    name: "Specular Button",
    description: "A glass capsule button whose rim catches the light, with a highlight that glides toward the cursor.",
    importName: "SpecularButton",
    importPath: "pleate/effects/specular-button",
    demos: [{ id: "basic", title: "On color", align: "stretch", Component: SpecularButtonBasic }],
    props: [
      { name: "size", type: "\"md\" | \"lg\"", default: "\"md\"", description: "Height and type." },
      { name: "...props", type: "button props", description: "Any button attribute." },
    ],
    a11y: ["A plain button; light layers are aria-hidden.", "Touch and reduced motion rest the light at the top left."],
  },
  "spotlight-card": {
    name: "Spotlight Card",
    description: "A card with a soft light that follows the pointer.",
    importName: "SpotlightCard",
    importPath: "pleate/effects/spotlight-card",
    demos: [{ id: "basic", title: "Two cards", align: "stretch", Component: SpotlightCardBasic }],
    props: [
      { name: "spotlightColor", type: "string", default: "accent at 22%", description: "Light color." },
      { name: "size", type: "number", default: "360", description: "Light radius (px)." },
    ],
    a11y: ["The light is decorative.", "Touch and reduced motion get the plain card."],
  },
  "swipe-stack": {
    name: "Swipe Stack",
    description: "A pile of cards you flick through: drag the top one away, or click it, and it tucks under the pile.",
    importName: "SwipeStack",
    importPath: "pleate/effects/swipe-stack",
    demos: [{ id: "basic", title: "Photos", align: "center", Component: SwipeStackBasic }],
    props: [
      { name: "cards", type: "ReactNode[]", description: "Card faces." },
      { name: "threshold", type: "number", default: "110", description: "Drag distance to send back (px)." },
      { name: "spread", type: "number", default: "4", description: "Turn of lower cards (deg)." },
      { name: "sendOnClick", type: "boolean", default: "true", description: "Click sends the top card back." },
    ],
    a11y: ["The top card is a focusable button: Enter, Space or the arrows send it back and focus moves to the new top card.", "Lower cards are aria-hidden."],
  },
  "staggered-menu": {
    name: "Staggered Menu",
    description: "A menu button that opens a side panel in layers: two colored sheets sweep in, then numbered links rise in sequence.",
    importName: "StaggeredMenu",
    importPath: "pleate/effects/staggered-menu",
    demos: [{ id: "basic", title: "In a header", align: "stretch", Component: StaggeredMenuBasic }],
    props: [
      { name: "items", type: "{ label, href }[]", description: "Links." },
      { name: "side", type: "\"left\" | \"right\"", default: "\"right\"", description: "Panel side." },
      { name: "layers", type: "[string, string]", default: "accent tones", description: "Sheet colors." },
      { name: "contained", type: "boolean", default: "false", description: "Fill the parent instead of the viewport." },
      { name: "onOpenChange", type: "(open) => void", description: "Open state." },
    ],
    a11y: ["The toggle has aria-expanded and aria-controls.", "Focus moves to the first link; Escape closes and returns focus to the toggle.", "Reduced motion fades it in."],
  },
  "step-flow": {
    name: "Step Flow",
    description: "A multi-step panel: dots fill and check as you go, content slides toward where you are heading, and the height eases to fit. For a progress indicator only, use Stepper.",
    importName: "StepFlow",
    importPath: "pleate/effects/step-flow",
    demos: [{ id: "basic", title: "Workspace setup", align: "center", Component: StepFlowBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "One child per step." },
      { name: "titles", type: "string[]", description: "Step names for the dots." },
      { name: "initialStep", type: "number", default: "0", description: "Start step." },
      { name: "onStepChange / onComplete", type: "functions", description: "Callbacks." },
      { name: "backLabel / nextLabel / completeLabel", type: "string", default: "Back / Continue / Finish", description: "Button text." },
      { name: "done", type: "ReactNode", description: "Shown after the last step." },
    ],
    a11y: ["Dots are buttons with aria-current=\"step\"; finished steps can be revisited.", "Reduced motion swaps steps without sliding."],
  },
  "tilted-card": {
    name: "Tilted Card",
    description: "An image that tilts toward the pointer and grows a little, with a caption tag trailing the cursor and an optional overlay.",
    importName: "TiltedCard",
    importPath: "pleate/effects/tilted-card",
    demos: [{ id: "basic", title: "Lakeside", align: "center", Component: TiltedCardBasic }],
    props: [
      { name: "src / alt", type: "string", description: "Image." },
      { name: "caption", type: "string", description: "Cursor tag, also a figcaption." },
      { name: "overlay", type: "ReactNode", description: "Content above the image." },
      { name: "maxTilt", type: "number", default: "12", description: "Tilt (deg)." },
      { name: "scale", type: "number", default: "1.06", description: "Hover scale." },
    ],
    a11y: ["A figure; the cursor tag is aria-hidden and the caption is in a visually hidden figcaption.", "Touch and reduced motion get the still image."],
  },
};
