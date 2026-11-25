// A small drawing surface made of palette indexes, for pixel art that is code instead of image files.
// - PixelBuffer: rectangles, ellipses, polygons, lines and spans, plus shade() which lights a shape from the top left
//   with a ramp of tones and an ordered (Bayer) dither between them, and outline() which draws the dark contour.
// - bufferToPaths: merges equal pixels into rectangles and returns one SVG path per color, so a drawing is a vector.
// Pure and DOM free, so it can be tested and run on the server.

/** Color of one palette slot: any CSS color, including var(--pl-accent). */
export type PixelColor = string;
/** Index into the palette plus one; 0 is an empty pixel. */
export type Ink = number;
/** True where a shape covers the pixel at x, y. */
export type Shape = (x: number, y: number) => boolean;

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered dither threshold of a pixel, from 0 up to (not including) 1. */
export const bayer = (x: number, y: number) => (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

export type ShadeOptions = {
  /** Direction the light comes from, in pixels. The default is the top left. */
  light?: readonly [number, number];
  /** Softness of the transitions between tones: 0 is hard bands, 1 is fully dithered. */
  dither?: number;
  /** Moves the bands: below 0 the shape is brighter, above 0 it is darker. */
  bias?: number;
};

export class PixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
  readonly palette: PixelColor[];

  constructor(width: number, height = width, palette: PixelColor[] = []) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
    this.palette = [...palette];
  }

  /** The ink of a color, added to the palette the first time it is used. */
  ink(color: PixelColor): Ink {
    const at = this.palette.indexOf(color);
    if (at >= 0) return at + 1;
    if (this.palette.length >= 255) throw new Error("pleate PixelBuffer: a drawing can use at most 255 colors");
    this.palette.push(color);
    return this.palette.length;
  }

  get(x: number, y: number): Ink {
    return x < 0 || y < 0 || x >= this.width || y >= this.height ? 0 : this.data[y * this.width + x];
  }

  set(x: number, y: number, ink: Ink) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    this.data[py * this.width + px] = ink;
  }

  clear() {
    this.data.fill(0);
    return this;
  }

  /** Fills a shape with one color. */
  fill(shape: Shape, color: PixelColor) {
    const ink = this.ink(color);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) if (shape(x, y)) this.data[y * this.width + x] = ink;
    return this;
  }

  /** Fills a shape with a ramp of tones, light to dark, along the light, with a dithered step between them. */
  shade(shape: Shape, ramp: readonly PixelColor[], { light = [-1, -1], dither = 0.5, bias = 0 }: ShadeOptions = {}) {
    const inks = ramp.map((c) => this.ink(c));
    const [lx, ly] = light;
    let min = Infinity;
    let max = -Infinity;
    const hits: number[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        if (!shape(x, y)) continue;
        const d = -(x * lx + y * ly);
        if (d < min) min = d;
        if (d > max) max = d;
        hits.push(x, y, d);
      }
    const span = max - min || 1;
    for (let i = 0; i < hits.length; i += 3) {
      const [x, y, d] = [hits[i], hits[i + 1], hits[i + 2]];
      const t = ((d - min) / span + bias) * inks.length + (bayer(x, y) - 0.5) * dither;
      this.data[y * this.width + x] = inks[Math.max(0, Math.min(inks.length - 1, Math.floor(t)))];
    }
    return this;
  }

  /** Recolors with a second color the pixels of a shape that pass the dither at this density (0..1). */
  speckle(shape: Shape, color: PixelColor, density: number) {
    const ink = this.ink(color);
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) if (shape(x, y) && bayer(x, y) < density) this.data[y * this.width + x] = ink;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, color: PixelColor) {
    return this.fill(shapes.rect(x, y, w, h), color);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: PixelColor) {
    return this.fill(shapes.ellipse(cx, cy, rx, ry), color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: PixelColor) {
    const ink = this.ink(color);
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, ink);
    return this;
  }

  /** Single pixels, as [x, y] pairs. */
  dots(points: readonly (readonly [number, number])[], color: PixelColor) {
    const ink = this.ink(color);
    for (const [x, y] of points) this.set(x, y, ink);
    return this;
  }

  /** Rows of characters: each one is looked up in `key`, anything else is left alone. */
  stamp(x: number, y: number, rows: readonly string[], key: Record<string, PixelColor>) {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const color = key[row[dx]];
        if (color) this.set(x + dx, y + dy, this.ink(color));
      }
    });
    return this;
  }

  /** Draws the contour on the empty pixels that touch the drawing. */
  outline(color: PixelColor, corners = false) {
    const ink = this.ink(color);
    const out: number[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        if (this.get(x, y)) continue;
        const side = this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1);
        const diagonal = corners && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1));
        if (side || diagonal) out.push(y * this.width + x);
      }
    for (const i of out) this.data[i] = ink;
    return this;
  }

  /** Copies another drawing on top, matching colors. */
  draw(other: PixelBuffer, x = 0, y = 0) {
    const inks = other.palette.map((c) => this.ink(c));
    for (let sy = 0; sy < other.height; sy++)
      for (let sx = 0; sx < other.width; sx++) {
        const v = other.data[sy * other.width + sx];
        if (v) this.set(x + sx, y + sy, inks[v - 1]);
      }
    return this;
  }
}

/** Shapes to fill, shade or combine. */
export const shapes = {
  rect:
    (x: number, y: number, w: number, h: number): Shape =>
    (px, py) =>
      px >= x && px < x + w && py >= y && py < y + h,
  // A little under 1, so whole radii do not leave a single pixel sticking out at the poles.
  ellipse:
    (cx: number, cy: number, rx: number, ry: number): Shape =>
    (px, py) =>
      ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 < 0.985,
  polygon:
    (points: readonly (readonly [number, number])[]): Shape =>
    (px, py) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    },
  /** A vertical taper, from topWidth to bottomWidth around cx. */
  taper:
    (cx: number, y: number, h: number, topWidth: number, bottomWidth: number): Shape =>
    (px, py) => {
      if (py < y || py >= y + h) return false;
      const t = h <= 1 ? 0 : (py - y) / (h - 1);
      return Math.abs(px - cx) <= (topWidth + (bottomWidth - topWidth) * t) / 2;
    },
  and:
    (...all: Shape[]): Shape =>
    (x, y) =>
      all.every((s) => s(x, y)),
  or:
    (...any: Shape[]): Shape =>
    (x, y) =>
      any.some((s) => s(x, y)),
  not:
    (shape: Shape): Shape =>
    (x, y) =>
      !shape(x, y),
};

export type PixelPath = { color: PixelColor; d: string };

/** Merges the pixels of each color into rectangles, one SVG path per color. */
export function bufferToPaths(buffer: PixelBuffer): PixelPath[] {
  const { width, height, data, palette } = buffer;
  const done = new Uint8Array(data.length);
  const paths = palette.map(() => "");
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const at = y * width + x;
      const ink = data[at];
      if (!ink || done[at]) continue;
      let w = 1;
      while (x + w < width && data[at + w] === ink && !done[at + w]) w++;
      let h = 1;
      grow: while (y + h < height) {
        for (let i = 0; i < w; i++) {
          const below = at + h * width + i;
          if (data[below] !== ink || done[below]) break grow;
        }
        h++;
      }
      for (let j = 0; j < h; j++) done.fill(1, at + j * width, at + j * width + w);
      paths[ink - 1] += `M${x} ${y}h${w}v${h}h${-w}z`;
    }
  return palette.map((color, i) => ({ color, d: paths[i] })).filter((p) => p.d);
}

/** A drawing: a size in pixels and the function that draws it. */
export type PixelDrawing = {
  id: string;
  name: string;
  size: number;
  draw: (p: PixelBuffer) => void;
};

/** Renders a drawing once. */
export function renderDrawing(drawing: Pick<PixelDrawing, "size" | "draw">): PixelBuffer {
  const p = new PixelBuffer(drawing.size);
  drawing.draw(p);
  return p;
}
