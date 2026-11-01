// Component pages for the React Bits inspired set (components-a). Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import AccordionGalleryBasic from "../accordion-gallery/basic";
import AnimatedListBasic from "../animated-list/basic";
import BorderGlowBasic from "../border-glow/basic";
import BounceCardsBasic from "../bounce-cards/basic";
import BubbleMenuBasic from "../bubble-menu/basic";
import CardNavBasic from "../card-nav/basic";
import CardSwapBasic from "../card-swap/basic";
import SwipeCarouselBasic from "../swipe-carousel/basic";
import ChromaGridBasic from "../chroma-grid/basic";
import CircularCarouselBasic from "../circular-carousel/basic";
import CircularGalleryBasic from "../circular-gallery/basic";
import CounterBasic from "../counter/basic";
import CurvedInputBasic from "../curved-input/basic";
import CurvedInputDown from "../curved-input/down";
import DecayCardBasic from "../decay-card/basic";
import DepthCarouselBasic from "../depth-carousel/basic";
import DockBasic from "../dock/basic";
import DomeGalleryBasic from "../dome-gallery/basic";
import DriftWallBasic from "../drift-wall/basic";
import ElasticSliderBasic from "../elastic-slider/basic";
import FlexCarouselBasic from "../flex-carousel/basic";
import FlowingMenuBasic from "../flowing-menu/basic";
import FluidGlassBasic from "../fluid-glass/basic";
import FluidGlassPill from "../fluid-glass/pill";
import FlyingPostersBasic from "../flying-posters/basic";
import FolderBasic from "../folder/basic";

const IMAGES = { name: "images", type: "{ src, alt }[]", description: "Pictures; alt is required." };
const LABEL = (d: string) => ({ name: "label", type: "string", default: `"${d}"`, description: "Accessible name." });
const CLASS = { name: "className", type: "string", description: "Extra classes on the root." };

export const DOCS_COMPONENTS_A: Record<string, ComponentDoc> = {
  "accordion-gallery": {
    name: "Accordion Gallery",
    description: "A row of photo panels. The one under the pointer or keyboard focus opens wide with its caption, the rest shrink to strips. Stacks vertically on phones.",
    importName: "AccordionGallery",
    importPath: "pleate/effects/accordion-gallery",
    demos: [{ id: "basic", title: "Trip photos", align: "stretch", Component: AccordionGalleryBasic }],
    props: [
      { name: "items", type: "{ src, alt, title, caption?, href? }[]", description: "Panels; href makes a panel a link." },
      { name: "defaultIndex", type: "number", default: "0", description: "Panel open at first." },
      { name: "height", type: "number", default: "420", description: "Row height in px on wider screens." },
      { name: "grow", type: "number", default: "5", description: "How much wider the open panel is." },
      LABEL("Gallery"),
    ],
    a11y: ["Each panel is focusable; focus opens it like hover does.", "Arrow keys, Home and End move between panels.", "Closed panels keep their title for screen readers."],
  },
  "animated-list": {
    name: "Animated List",
    description: "A scrolling list whose rows pop in as they scroll into view, with soft fades at both ends. Pick a row with a click or the keyboard.",
    importName: "AnimatedList",
    importPath: "pleate/effects/animated-list",
    demos: [{ id: "basic", title: "Recent files", Component: AnimatedListBasic }],
    props: [
      { name: "items", type: "T[]", description: "Rows." },
      { name: "renderItem", type: "(item, index, selected) => ReactNode", default: "String(item)", description: "Row content." },
      { name: "onSelect", type: "(item, index) => void", description: "Called on click or Enter." },
      { name: "fades", type: "boolean", default: "true", description: "Fade the top and bottom edges." },
      { name: "height", type: "number", default: "360", description: "Scroll area height in px." },
      LABEL("Items"),
    ],
    a11y: ["A listbox: arrow keys, Home and End move the highlight and keep it in view, Enter picks.", "Reduced motion skips the entrance."],
  },
  "border-glow": {
    name: "Border Glow",
    description: "A card whose border lights up on the side nearest the pointer, brighter the closer you get to the edge, with a soft halo outside.",
    importName: "BorderGlow",
    importPath: "pleate/effects/border-glow",
    demos: [{ id: "basic", title: "Stat cards", align: "stretch", Component: BorderGlowBasic }],
    props: [
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Glow color." },
      { name: "borderWidth", type: "number", default: "1.5", description: "Lit border thickness in px." },
      { name: "spread", type: "number", default: "70", description: "Width of the lit arc in degrees." },
      { name: "halo", type: "number", default: "18", description: "Blur of the outer halo; 0 turns it off." },
    ],
    a11y: ["The light is decorative and hidden from assistive tech.", "Touch screens and reduced motion get a still, faint glow."],
  },
  "bounce-cards": {
    name: "Bounce Cards",
    description: "A fan of photo cards that bounce in when they come into view. The hovered or focused card straightens and lifts while its neighbours lean away.",
    importName: "BounceCards",
    importPath: "pleate/effects/bounce-cards",
    demos: [{ id: "basic", title: "Album", Component: BounceCardsBasic }],
    props: [
      IMAGES,
      { name: "cardWidth / cardHeight", type: "number", default: "180 / 220", description: "Card size in px." },
      { name: "overlap", type: "number", default: "110", description: "Distance between card centers in px." },
      { name: "fanAngle", type: "number", default: "10", description: "Tilt of the outer cards in degrees." },
      { name: "stagger", type: "number", default: "0.08", description: "Delay between cards on entrance, seconds." },
    ],
    a11y: ["Cards are focusable and react to focus like hover.", "Reduced motion shows the fan without the bounce."],
  },
  "bubble-menu": {
    name: "Bubble Menu",
    description: "A floating logo pill and menu button. Opening it pops the links out as big tilted bubbles over a blurred backdrop.",
    importName: "BubbleMenu",
    importPath: "pleate/effects/bubble-menu",
    demos: [{ id: "basic", title: "Site menu", align: "stretch", Component: BubbleMenuBasic }],
    props: [
      { name: "items", type: "{ label, href, rotation?, color? }[]", description: "Links; color fills the bubble on hover and focus." },
      { name: "logo", type: "ReactNode", description: "Left pill content." },
      { name: "position", type: '"fixed" | "absolute"', default: '"fixed"', description: "Cover the viewport or the nearest positioned parent." },
      { name: "openLabel / closeLabel", type: "string", default: '"Open menu" / "Close menu"', description: "Button names." },
      LABEL("Main"),
    ],
    a11y: ["The button is a disclosure with aria-expanded and aria-controls.", "Focus moves to the first link on open; Escape closes and returns focus.", "Reduced motion skips the pop."],
  },
  "card-nav": {
    name: "Card Nav",
    description: "A floating navigation bar that springs open into a row of cards, each with a title and its own links.",
    importName: "CardNav",
    importPath: "pleate/effects/card-nav",
    demos: [{ id: "basic", title: "Company site", align: "stretch", Component: CardNavBasic }],
    props: [
      { name: "groups", type: "{ title, links, background?, color? }[]", description: "One card per group." },
      { name: "logo", type: "ReactNode", description: "Brand in the middle of the bar." },
      { name: "action", type: "ReactNode", description: "Call to action on the right." },
      { name: "openLabel / closeLabel", type: "string", default: '"Open menu" / "Close menu"', description: "Button names." },
      LABEL("Main"),
    ],
    a11y: ["The menu button is a disclosure with aria-expanded.", "Escape closes and returns focus to the button.", "Cards stack on narrow screens."],
  },
  "card-swap": {
    name: "Card Swap",
    description: "A deck of cards stacked in depth. On a timer the front card drops away and slides in at the back.",
    importName: "CardSwap",
    importPath: "pleate/effects/card-swap",
    demos: [{ id: "basic", title: "Highlights", Component: CardSwapBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "One child per card." },
      { name: "width / height", type: "number", default: "320 / 220", description: "Card size in px." },
      { name: "distanceX / distanceY", type: "number", default: "40 / 36", description: "Offset between stacked cards in px." },
      { name: "interval", type: "number", default: "4000", description: "Time each card stays in front, ms." },
      { name: "pauseOnHover", type: "boolean", default: "true", description: "Stop the timer under the pointer." },
      LABEL("Cards"),
    ],
    a11y: ["Only the front card is exposed to assistive tech.", "A pause button stops the timer; hover and focus pause it too.", "Reduced motion stops the timer and the button steps through the cards."],
  },
  "swipe-carousel": {
    name: "Swipe Carousel",
    description: "One card at a time that you swipe or drag sideways, with dots and an optional autoplay timer that fills the active dot. For a 3D ring, see 3D Effects.",
    importName: "SwipeCarousel",
    importPath: "pleate/effects/swipe-carousel",
    demos: [{ id: "basic", title: "Feature tour", Component: SwipeCarouselBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "One child per slide." },
      { name: "index / defaultIndex / onIndexChange", type: "number", default: "0", description: "Controlled or uncontrolled slide." },
      { name: "autoplay", type: "number", default: "0", description: "Time per slide in ms; 0 is off." },
      { name: "loop", type: "boolean", default: "true", description: "Wrap around at the ends." },
      LABEL("Carousel"),
    ],
    a11y: ["A carousel region: arrow keys, Home and End move between slides when it has focus.", "Hidden slides are inert; each slide is labelled n of m.", "Autoplay pauses on hover and focus and is off with reduced motion."],
  },
  "chroma-grid": {
    name: "Chroma Grid",
    description: "Profile cards shown in grayscale, with a circle of full color following the pointer across the grid and a lit border on the card under it.",
    importName: "ChromaGrid",
    importPath: "pleate/effects/chroma-grid",
    demos: [{ id: "basic", title: "Team", align: "stretch", Component: ChromaGridBasic }],
    props: [
      { name: "items", type: "{ image, alt, title, subtitle?, handle?, href?, color? }[]", description: "Cards; href makes a card a link." },
      { name: "radius", type: "number", default: "260", description: "Spotlight radius in px." },
      { name: "minCardWidth", type: "number", default: "220", description: "Smallest card width in px." },
    ],
    a11y: ["The grayscale layer is decorative.", "Touch screens and reduced motion show the cards in color."],
  },
  "circular-carousel": {
    name: "Circular Carousel",
    description: "Images on a free spinning 3D ring: drag with momentum, it snaps to the nearest card, click a card to bring it to the front.",
    importName: "CircularCarousel",
    importPath: "pleate/effects/circular-carousel",
    demos: [{ id: "basic", title: "Places", align: "stretch", Component: CircularCarouselBasic }],
    props: [
      { name: "images", type: "{ src, alt, title? }[]", description: "Cards on the ring." },
      { name: "cardWidth / cardHeight", type: "number", default: "180 / 240", description: "Card size in px." },
      { name: "radius", type: "number", description: "Ring radius; fits the cards by default." },
      { name: "tilt", type: "number", default: "8", description: "Camera tilt in degrees." },
      { name: "onIndexChange", type: "(index) => void", description: "Called when the front card changes." },
      LABEL("Gallery"),
    ],
    a11y: ["Cards are buttons with a roving tab stop; arrow keys, Home and End turn the ring.", "The front card title is announced politely.", "Reduced motion snaps without spinning."],
  },
  "circular-gallery": {
    name: "Circular Gallery",
    description: "A strip of photos bent along an arc. Scroll, drag or Tab through it; each card opens the full image in a dialog.",
    importName: "CircularGallery",
    importPath: "pleate/effects/circular-gallery",
    demos: [{ id: "basic", title: "Travel photos", align: "stretch", Component: CircularGalleryBasic }],
    props: [
      { name: "images", type: "{ src, alt, title?, full? }[]", description: "Cards; full is the larger image for the dialog." },
      { name: "cardWidth / cardHeight", type: "number", default: "220 / 280", description: "Card size in px." },
      { name: "bend", type: "number", default: "90", description: "How far the outer cards sink; negative bends up." },
      { name: "turn", type: "number", default: "14", description: "Card rotation along the arc, degrees." },
      LABEL("Gallery"),
    ],
    a11y: ["A native scroller: keyboard, wheel and touch work as usual.", "Cards are buttons; the dialog traps focus and closes with Escape."],
  },
  counter: {
    name: "Counter",
    description: "A number whose digits roll like a mechanical counter, each place on its own spring, passing through the digits in between.",
    importName: "Counter",
    importPath: "pleate/effects/counter",
    demos: [{ id: "basic", title: "Rolling digits", Component: CounterBasic }],
    props: [
      { name: "value", type: "number", description: "Whole number to show." },
      { name: "minDigits", type: "number", default: "1", description: "Pad with leading zeros." },
      { name: "fontSize", type: "number", default: "64", description: "Size in px; the window follows it." },
      { name: "fade", type: "number", default: "0.18", description: "Edge fade as a share of the digit height." },
      { name: "stiffness", type: "number", default: "120", description: "Spring stiffness." },
    ],
    a11y: ["Screen readers get the plain number; the digit columns are hidden.", "Reduced motion jumps to the new value."],
  },
  "curved-input": {
    name: "Curved Input",
    description: "A text field bent along an arc: the bar, the text, the caret and the send button all follow the curve. A real input sits underneath.",
    importName: "CurvedInput",
    importPath: "pleate/effects/curved-input",
    demos: [
      { id: "basic", title: "Message", Component: CurvedInputBasic },
      { id: "down", title: "Bent down", Component: CurvedInputDown },
    ],
    props: [
      { name: "label", type: "string", description: "Accessible name of the field (required)." },
      { name: "onSubmit", type: "(value) => void", description: "Enter or the button." },
      { name: "placeholder", type: "string", default: '"Type something"', description: "Hint text on the curve." },
      { name: "width", type: "number", default: "520", description: "Bar width in px; shrinks to fit." },
      { name: "curve", type: "number", default: "60", description: "Rise of the middle in px; negative bends down." },
      { name: "thickness", type: "number", default: "56", description: "Bar thickness in px." },
      { name: "submitLabel", type: "string", default: '"Send"', description: "Button name." },
    ],
    a11y: ["A real input handles typing, selection, paste and autofill; the drawing is hidden.", "The send button is a labelled submit button."],
  },
  "decay-card": {
    name: "Decay Card",
    description: "An image card that warps like wet paint as the pointer moves over it, then settles back to a clean image.",
    importName: "DecayCard",
    importPath: "pleate/effects/decay-card",
    demos: [{ id: "basic", title: "Warp on move", Component: DecayCardBasic }],
    props: [
      { name: "src / alt", type: "string", description: "Image and its description." },
      { name: "width / height", type: "number", default: "300 / 400", description: "Card size in px." },
      { name: "intensity", type: "number", default: "70", description: "Strongest displacement in px." },
      { name: "children", type: "ReactNode", description: "Caption drawn over the image." },
    ],
    a11y: ["The image keeps its alt text; the filter is visual only.", "Touch screens and reduced motion show the plain card."],
  },
  "depth-carousel": {
    name: "Depth Carousel",
    description: "Cards on a rail that runs back into depth. Drag, use the arrows or let it advance on a timer.",
    importName: "DepthCarousel",
    importPath: "pleate/effects/depth-carousel",
    demos: [{ id: "basic", title: "Stories", align: "stretch", Component: DepthCarouselBasic }],
    props: [
      { name: "children", type: "ReactNode", description: "One child per card." },
      { name: "index / defaultIndex / onIndexChange", type: "number", default: "0", description: "Controlled or uncontrolled card." },
      { name: "cardWidth / cardHeight", type: "number", default: "280 / 360", description: "Card size in px." },
      { name: "visible", type: "number", default: "3", description: "Cards shown behind the front one." },
      { name: "autoplay", type: "number", default: "0", description: "Time per card in ms; 0 is off." },
      LABEL("Carousel"),
    ],
    a11y: ["Previous and next buttons plus arrow keys, Home and End.", "Only the front card is exposed; the position is announced.", "Autoplay pauses on hover and focus and is off with reduced motion."],
  },
  dock: {
    name: "Dock",
    description: "App icons on a glass shelf that magnify as the pointer passes, with a label above the hovered one.",
    importName: "Dock",
    importPath: "pleate/effects/dock",
    demos: [{ id: "basic", title: "Apps", Component: DockBasic }],
    props: [
      { name: "items", type: "{ icon, label, onClick?, href?, active? }[]", description: "Icons; active shows a dot." },
      { name: "size", type: "number", default: "48", description: "Rest size in px." },
      { name: "magnification", type: "number", default: "76", description: "Size under the pointer in px." },
      { name: "distance", type: "number", default: "150", description: "Reach of the magnification in px." },
      LABEL("Dock"),
    ],
    a11y: ["A toolbar with one tab stop; arrow keys, Home and End move between items.", "Each item is named by its label, also shown on focus.", "Touch screens and reduced motion keep the rest size."],
  },
  "dome-gallery": {
    name: "Dome Gallery",
    description: "Photos tiled on the inside of a sphere. Drag to look around; click a tile to open it.",
    importName: "DomeGallery",
    importPath: "pleate/effects/dome-gallery",
    demos: [{ id: "basic", title: "Photo dome", align: "stretch", Component: DomeGalleryBasic }],
    props: [
      IMAGES,
      { name: "columns / rows", type: "number", default: "12 / 3", description: "Tiles around and up the dome." },
      { name: "radius", type: "number", default: "520", description: "Sphere radius in px." },
      { name: "height", type: "number", default: "480", description: "Viewport height in px." },
      LABEL("Gallery"),
    ],
    a11y: ["Tiles are buttons; focusing one turns the dome to face it.", "Arrow keys look around when the dome has focus.", "The photo opens in a modal dialog that closes with Escape."],
  },
  "drift-wall": {
    name: "Drift Wall",
    description: "An endless wall of image tiles at an angle, rows drifting in alternating directions. Hovered tiles lift towards you.",
    importName: "DriftWall",
    importPath: "pleate/effects/drift-wall",
    demos: [{ id: "basic", title: "Wall", align: "stretch", Component: DriftWallBasic }],
    props: [
      IMAGES,
      { name: "rows", type: "number", default: "4", description: "Number of rows." },
      { name: "tileWidth / tileHeight", type: "number", default: "200 / 130", description: "Tile size in px." },
      { name: "duration", type: "number", default: "40", description: "Seconds for one loop of a row." },
      { name: "angle", type: "[x, y, z]", default: "[20, -24, 8]", description: "Wall rotation in degrees." },
      { name: "height", type: "number", default: "420", description: "Viewport height in px." },
    ],
    a11y: ["Duplicate tiles are hidden from assistive tech.", "The wall stops under the pointer and with reduced motion."],
  },
  "elastic-slider": {
    name: "Elastic Slider",
    description: "A slider that thickens as you touch it and stretches like rubber past either end, then springs back.",
    importName: "ElasticSlider",
    importPath: "pleate/effects/elastic-slider",
    demos: [{ id: "basic", title: "Volume and brightness", Component: ElasticSliderBasic }],
    props: [
      { name: "label", type: "string", description: "Accessible name (required)." },
      { name: "value / defaultValue / onValueChange", type: "number", default: "50", description: "Controlled or uncontrolled value." },
      { name: "min / max / step", type: "number", default: "0 / 100 / 1", description: "Range." },
      { name: "startIcon / endIcon", type: "ReactNode", description: "Icons that the stretch nudges." },
      { name: "showValue", type: "boolean", default: "false", description: "Show the number below." },
      { name: "maxStretch", type: "number", default: "40", description: "Farthest stretch in px." },
    ],
    a11y: ["role=slider with arrow keys, Page Up, Page Down, Home and End.", "Reduced motion drops the stretch."],
  },
  "flex-carousel": {
    name: "Flex Carousel",
    description: "An endless row of images that bends through liquid glass at its edges: swollen and rippled at the sides, clear in the middle.",
    importName: "FlexCarousel",
    importPath: "pleate/effects/flex-carousel",
    demos: [{ id: "basic", title: "Highlights", align: "stretch", Component: FlexCarouselBasic }],
    props: [
      IMAGES,
      { name: "itemWidth / itemHeight", type: "number", default: "220 / 280", description: "Tile size in px." },
      { name: "duration", type: "number", default: "30", description: "Seconds for one loop." },
      { name: "edge", type: "number", default: "0.22", description: "Glass width as a share of the row." },
      { name: "distortion", type: "number", default: "40", description: "Warp strength in px." },
      LABEL("Gallery"),
    ],
    a11y: ["Only one copy of the images is read.", "Pauses on hover; reduced motion keeps it still."],
  },
  "flowing-menu": {
    name: "Flowing Menu",
    description: "Big text links. Hovering a row slides in a colored band from the edge the pointer came through, carrying a marquee of the label and a picture.",
    importName: "FlowingMenu",
    importPath: "pleate/effects/flowing-menu",
    demos: [{ id: "basic", title: "Destinations", align: "stretch", Component: FlowingMenuBasic }],
    props: [
      { name: "items", type: "{ label, href, image? }[]", description: "Links." },
      { name: "bandColor / bandText", type: "string", default: "accent / on-accent", description: "Band colors." },
      { name: "speed", type: "number", default: "12", description: "Seconds per marquee loop." },
      LABEL("Menu"),
    ],
    a11y: ["A nav of plain links; the band and marquee are decorative.", "Keyboard focus shows the band.", "Reduced motion skips the slide and keeps the marquee still."],
  },
  "fluid-glass": {
    name: "Fluid Glass",
    description: "A thick glass lens or pill gliding over content after the pointer, bending what is under it with a bright rim.",
    importName: "FluidGlass",
    importPath: "pleate/effects/fluid-glass",
    demos: [
      { id: "basic", title: "Lens", align: "stretch", Component: FluidGlassBasic },
      { id: "pill", title: "Pill", align: "stretch", Component: FluidGlassPill },
    ],
    props: [
      { name: "children", type: "ReactNode", description: "What the glass slides over." },
      { name: "shape", type: '"lens" | "pill"', default: '"lens"', description: "Glass shape." },
      { name: "size", type: "number", default: "180", description: "Glass height in px." },
      { name: "strength", type: "number", default: "40", description: "Refraction in px." },
      { name: "magnify", type: "number", default: "1.15", description: "Zoom inside the glass." },
      { name: "tint", type: "string", default: "rgb(255 255 255 / 0.06)", description: "Glass tint." },
    ],
    a11y: ["The glass is decorative and ignores pointer events.", "The glass shows an inert copy of the content, hidden from assistive tech; keep that content light.", "Touch screens and reduced motion park the glass in the middle."],
  },
  "flying-posters": {
    name: "Flying Posters",
    description: "A column of posters streaming upward as if around a drum. Drag to push the stream; it bends harder the faster it goes.",
    importName: "FlyingPosters",
    importPath: "pleate/effects/flying-posters",
    demos: [{ id: "basic", title: "Posters", align: "stretch", Component: FlyingPostersBasic }],
    props: [
      { name: "images", type: "{ src, alt }[]", description: "Posters; use six or more so the loop has no gaps." },
      { name: "posterWidth / posterHeight", type: "number", default: "220 / 300", description: "Poster size in px." },
      { name: "gap", type: "number", default: "40", description: "Space between posters in px." },
      { name: "drift", type: "number", default: "40", description: "Idle speed in px per second." },
      { name: "bend", type: "number", default: "0.6", description: "How much the stream curves, 0 to 1." },
      LABEL("Posters"),
    ],
    a11y: ["Focusable region: arrow keys and Page Up or Down push the stream.", "Reduced motion stops the drift."],
  },
  folder: {
    name: "Folder",
    description: "A folder that opens on click: the flap tilts down and up to three papers fan out, leaning towards the pointer.",
    importName: "Folder",
    importPath: "pleate/effects/folder",
    demos: [{ id: "basic", title: "Folders", Component: FolderBasic }],
    props: [
      { name: "items", type: "ReactNode[]", description: "Up to three papers." },
      { name: "open / defaultOpen / onOpenChange", type: "boolean", default: "false", description: "Controlled or uncontrolled." },
      { name: "color", type: "string", default: "var(--pl-accent)", description: "Folder color." },
      { name: "size", type: "number", default: "120", description: "Width in px." },
      { name: "label", type: "string", default: '"Folder"', description: "Accessible name of the toggle." },
      CLASS,
    ],
    a11y: ["A toggle button with aria-expanded.", "Paper content is hidden while closed.", "Reduced motion opens without springs."],
  },
};
