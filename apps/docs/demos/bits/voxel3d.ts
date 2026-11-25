// Component pages of the Voxel3D section. Same shape as DOCS in demos/index.ts; merged there.
import type { ComponentDoc } from "../index";
import PixelArtBasic from "../pixel-art/basic";
import PixelArtFrame from "../pixel-art/frame";
import PixelCanvasGrowing from "../pixel-canvas/growing";
import PixelGalleryAll from "../pixel-gallery/all";
import VoxelGalleryAll from "../voxel-gallery/all";
import VoxelSceneBurger from "../voxel-scene/burger";
import VoxelViewDrawing from "../voxel-view/drawing";
import VoxelViewExplode from "../voxel-view/explode";
import VoxelViewParcel from "../voxel-view/parcel";

export const DOCS_VOXEL3D: Record<string, ComponentDoc> = {
  "voxel-scene": {
    name: "Voxel Scene",
    description: "Voxel models drawn as large pixels with a dark contour and a disc behind, moved by the scroll. Models come apart, land voxel by voxel and throw cubes. A scene weighs a few kilobytes, with no image or model files.",
    importName: "VoxelScene, Volume, solids, decodeVolume, loadVox",
    importPath: "pleate/effects/voxel-scene",
    demos: [
      { id: "burger", title: "A burger coming together", description: "Scroll the page: the layers meet, then the crumbs fly. Switch the palette and the disc follows.", align: "stretch", Component: VoxelSceneBurger },
    ],
    props: [
      { name: "setup(ctx)", type: "(ctx) => { frame?, theme?, dispose? } | Promise", description: "Builds the scene once per mount. ctx is a ThreeScene context with add(), burst(), shadow() and disc; ctx.scene is what gets drawn as pixels." },
      { name: "ctx.add(model, size)", type: "VoxelActor", default: "size 2", description: "Adds a model with its largest side at `size`. The actor has group, parts (by id), size, explode(0..1) and build(0..1)." },
      { name: "ctx.burst({ count, colors, cube, spread, gravity, seed })", type: "{ mesh, set(0..1) }", description: "Flying cubes. The same value always gives the same picture, so it can follow the scroll." },
      { name: "ctx.shadow(radius) / ctx.disc", type: "Mesh / { radius, center }", description: "A dithered shadow on the ground, and where the picture sits: center moves the models and the disc together." },
      { name: "pixel", type: "number (px)", default: "4", description: "Side of one pixel of the picture." },
      { name: "outline", type: "string | false", default: '"#2a1720"', description: "Color of the contour." },
      { name: "disc", type: "boolean | { color, radius, center }", default: "false", description: "The flat disc behind, in the accent color unless told otherwise." },
      { name: "bands / dither / grain / light", type: "number / 0..1 / 0..1 / [x, y, z]", default: "4 / 0.55 / 0.3", description: "Steps of light, softness between them, difference between single voxels, and where the light comes from." },
      { name: "progress / loop / fov / fallback / label", type: "as in ThreeScene", description: "The scroll of the enclosing ScrollScene by default. Draws only when something changed unless loop is always." },
      { name: "new Volume(w, h, d)", type: "fill, carve, paint, speckle, set", description: "A model in code, from solids: box, ellipsoid, cylinder, ring, and, or, not. Colors are any CSS color, theme variables included." },
      { name: "volumeFromPixels(drawing, depth, rim)", type: "Volume", description: "Any pixel drawing as a standing voxel model." },
      { name: "loadVox(url) / decodeVolume(text)", type: "Promise<Volume> / Volume", description: "A MagicaVoxel file, or a model saved as a short string with encodeVolume." },
    ],
    a11y: [
      "Pass label to describe the picture; without it the canvas is hidden from screen readers.",
      "Nothing draws off screen or in a hidden tab, and the WebGL context is released on unmount.",
      "Reduced motion stops the clock. What the scroll moves still moves, since the reader moves it.",
      "Without WebGL2 the fallback shows instead: a PixelArt of the same thing works well.",
    ],
  },
  "voxel-view": {
    name: "Voxel View",
    description: "One voxel model that turns by itself, by drag or with the arrow keys. It can land voxel by voxel, come apart, and move its parts.",
    importName: "VoxelView, voxelModel, volumeFromPixels",
    importPath: "pleate/effects/voxel-scene",
    demos: [
      { id: "explode", title: "Take it apart", description: "Drag the model to turn it, and the slider to separate its parts.", align: "stretch", Component: VoxelViewExplode },
      { id: "parcel", title: "Moving a part", description: "The lid lifts and the gem turns in the air.", align: "stretch", Component: VoxelViewParcel },
      { id: "drawing", title: "From a pixel drawing", description: "Any drawing of the pixel gallery becomes a model.", align: "stretch", Component: VoxelViewDrawing },
    ],
    props: [
      { name: "model", type: "VoxelModel", description: "From pleate/effects/voxel-gallery, or yours: { id, name, parts: [{ id, volume, at, away }] }." },
      { name: "spin", type: "number", default: "4", description: "Turns per minute while nobody drags. 0 stands still and draws only on change." },
      { name: "interactive", type: "boolean", default: "true", description: "Drag and arrow keys." },
      { name: "explode", type: "number (0..1)", default: "0", description: "How far apart the parts are. Changes are eased." },
      { name: "build", type: "boolean", default: "false", description: "The voxels land when it mounts." },
      { name: "pose(actor, { time, delta })", type: "function", description: "Called before each frame, to move parts by hand." },
      { name: "margin", type: "number", default: "1.15", description: "Room around the model." },
      { name: "pixel, outline, disc, bands, dither, grain, light", type: "as in VoxelScene", description: "The look." },
    ],
    a11y: [
      "A named image. When it is interactive it takes the focus and the arrow keys turn it.",
      "On touch screens a vertical swipe scrolls the page; only the sideways drag turns the model.",
      "Reduced motion stops the turning and the landing, and parts jump to their place.",
    ],
  },
  "voxel-gallery": {
    name: "Voxel Gallery",
    description: "Twelve voxel models in parts, ready for VoxelView and VoxelScene, plus voxelDrawing() to turn any of the forty drawings into a model.",
    importName: "voxelModels, voxelBurger, voxelLighthouse, voxelDrawing",
    importPath: "pleate/effects/voxel-gallery",
    demos: [{ id: "all", title: "Every model", description: "Pick one, turn it, take it apart.", align: "stretch", Component: VoxelGalleryAll }],
    props: [
      { name: "voxelModels", type: "VoxelModel[]", description: "All of them, also exported one by one: voxelBurger, voxelCoffee, voxelRamen, voxelHouse, voxelLighthouse, voxelBoat, voxelPlant, voxelRocket, voxelCamera, voxelComputer, voxelParcel, voxelChest." },
      { name: "voxelDrawing(id, depth)", type: "VoxelModel", default: "depth 5", description: "A drawing of the pixel gallery, standing up." },
    ],
    a11y: ["Give VoxelView a label that says what the model means on your page; by default it reads the model's name."],
  },
  "pixel-art": {
    name: "Pixel Art",
    description: "Pixel drawings as crisp SVG vectors, made in code: shapes with dithered shading and one dark contour. Plus stepped frames with a hard shadow and a row of step squares.",
    importName: "PixelArt, PixelFrame, PixelSteps, PixelBuffer, shapes",
    importPath: "pleate/effects/pixel-art",
    demos: [
      { id: "basic", title: "Drawings", description: "Two from the gallery and one made here, in the accent color of the theme.", Component: PixelArtBasic },
      { id: "frame", title: "Frames and steps", description: "PixelFrame goes around any pleate component. Press a square to pick a step.", Component: PixelArtFrame },
    ],
    props: [
      { name: "PixelArt art", type: "drawing | PixelBuffer", description: "A drawing of the gallery or your own buffer. It renders on the server." },
      { name: "PixelArt colors", type: "Record<string, string>", description: "Swaps colors, for example to theme variables." },
      { name: "PixelArt label", type: "string", description: "Accessible name; without it the drawing is decorative." },
      { name: "PixelFrame step / shadow / color", type: "number (px) / number (px) / string", default: "2 / 4 / var(--pl-fg)", description: "Corner step, hard shadow and border color." },
      { name: "PixelSteps steps / current / onSelect", type: "number | string[] / number / (step) => void", description: "Squares for the steps of a scene. Inside a ScrollScene it follows the scroll; with onSelect they are buttons." },
      { name: "new PixelBuffer(size)", type: "shade, fill, speckle, rect, ellipse, line, dots, stamp, outline, draw", description: "The drawing surface. shade() lights a shape from the top left with a ramp of tones." },
      { name: "shapes", type: "rect, ellipse, polygon, taper, and, or, not", description: "Shapes to fill or shade." },
    ],
    a11y: [
      "A drawing with a label is a named image; without one it is hidden from screen readers.",
      "PixelSteps is a list that marks the current step, with real buttons when it can be pressed.",
      "PixelFrame keeps a visible focus ring outside the stepped corners.",
    ],
  },
  "pixel-canvas": {
    name: "Pixel Canvas",
    description: "A 96 by 96 canvas redrawn from code and scaled up with hard edges. Inside a ScrollScene it follows the scroll, with an optional clock for steam, bubbles and sway.",
    importName: "PixelCanvas, PixelSteps, shapes",
    importPath: "pleate/effects/pixel-art",
    demos: [{ id: "growing", title: "A flower growing", description: "Scroll the page. Nothing here is an image.", align: "stretch", Component: PixelCanvasGrowing }],
    props: [
      { name: "draw(p, { progress, time })", type: "function", description: "Draws one frame on a cleared PixelBuffer." },
      { name: "size", type: "number", default: "96", description: "Pixels on each side." },
      { name: "progress", type: "MotionValue<number>", description: "Defaults to the enclosing ScrollScene's progress." },
      { name: "animate / fps", type: "boolean / number", default: "false / 12", description: "Run the clock, at this many frames per second." },
      { name: "label", type: "string", description: "Accessible name of the picture." },
    ],
    a11y: [
      "Reduced motion stops the clock; the scroll still drives the picture.",
      "Nothing draws off screen or in a hidden tab.",
      "Theme colors are read again when the theme or the palette changes.",
    ],
  },
  "pixel-gallery": {
    name: "Pixel Gallery",
    description: "Forty drawings of 32 by 32 pixels: food, nature, objects and tech. Vectors made of code, about half a kilobyte each.",
    importName: "pixelDrawings, pixelDrawing, pixelRamps",
    importPath: "pleate/effects/pixel-gallery",
    demos: [{ id: "all", title: "Every drawing", description: "Press one to copy its code.", align: "stretch", Component: PixelGalleryAll }],
    props: [
      { name: "pixelDrawings", type: "GalleryDrawing[]", description: "All of them: id, name, category, size and draw." },
      { name: "pixelDrawing(id)", type: "GalleryDrawing", description: "One by its id." },
      { name: "pixelCategories", type: "string[]", description: "food, nature, objects, tech." },
      { name: "pixelRamps / PIXEL_INK", type: "Record<string, [light, mid, dark]> / string", description: "The tones and the contour color of the gallery, to draw more in the same style." },
    ],
    a11y: ["Drawings are decorative unless PixelArt gets a label."],
  },
};
