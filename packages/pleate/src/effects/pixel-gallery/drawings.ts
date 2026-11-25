// The drawings of the gallery, 32 by 32 pixels each, all made with the same tools: shapes shaded from the top left with
// a three tone ramp, a few details by hand, and one dark contour at the end. Each one is code, so it weighs a few hundred
// bytes, renders as a vector (PixelArt) and can become voxels (volumeFromPixels in pleate/effects/voxel-scene).
import { shapes, type PixelBuffer, type PixelDrawing, type Shape } from "../pixel-art/buffer.ts";

export const PIXEL_INK = "#2a1720";

/** Three tones per material, light to dark. */
export const pixelRamps = {
  red: ["#ff7a5c", "#e5402f", "#a8212b"],
  orange: ["#ffb454", "#f07f22", "#b9531a"],
  yellow: ["#ffe27a", "#f7b733", "#c7811f"],
  green: ["#9bdc6a", "#4fa84a", "#2a6b46"],
  teal: ["#8be6d3", "#2fae9f", "#1b6b73"],
  blue: ["#7cc4ff", "#3b82e6", "#22489c"],
  purple: ["#c79bf2", "#8a58d6", "#4f2f8f"],
  pink: ["#ffb3cf", "#ef6f9f", "#b23a74"],
  brown: ["#c98a55", "#8e5530", "#57301f"],
  cream: ["#fff6e0", "#f3dcae", "#cfa873"],
  grey: ["#dfe5ec", "#9aa7b8", "#5b677a"],
  dark: ["#5a6275", "#3a4052", "#232838"],
  white: ["#ffffff", "#e8ecf4", "#b9c2d2"],
} as const;

const r = pixelRamps;
const { rect, ellipse, polygon, taper, and, or, not } = shapes;

export type PixelCategory = "food" | "nature" | "objects" | "tech";
export type GalleryDrawing = PixelDrawing & { category: PixelCategory };

const list: GalleryDrawing[] = [];
const add = (category: PixelCategory, id: string, name: string, draw: (p: PixelBuffer) => void, after?: (p: PixelBuffer) => void) =>
  list.push({
    id,
    name,
    category,
    size: 32,
    draw: (p) => {
      draw(p);
      p.outline(PIXEL_INK);
      after?.(p); // steam and light stay without a contour
    },
  });

/* ---------------------------------------------------------------------------------------------------------- food */

add("food", "coffee", "Coffee", (p) => {
  const ring = and(ellipse(23, 18, 5.5, 5.5), not(ellipse(23, 18, 2.6, 2.6)));
  p.shade(ring, r.white);
  p.shade(ellipse(15, 27, 12, 2.4), r.grey);
  p.shade(or(taper(14, 12, 12, 18, 14), rect(9, 24, 11, 2)), r.white);
  p.shade(ellipse(14, 12, 9.4, 2.6), r.white, { light: [1, 1] });
  p.ellipse(14, 12, 7.6, 1.6, r.brown[2]).ellipse(13, 12, 3.4, 0.8, r.brown[0]);
  p.rect(6, 18, 17, 2, r.teal[1]);
}, (p) => {
  for (const [x, y] of [[9, 3], [14, 1], [19, 3]]) p.dots([[x, y], [x + 1, y + 1], [x + 1, y + 2], [x, y + 3], [x, y + 4]], "#b9aec6");
});

add("food", "donut", "Donut", (p) => {
  const body = and(ellipse(15.5, 16, 12.5, 12), not(ellipse(15.5, 15, 3.6, 3.4)));
  p.shade(body, r.brown, { bias: -0.2 });
  p.shade(and(ellipse(15.5, 14.6, 11.4, 10.4), not(ellipse(15.5, 15, 4.6, 4.4))), r.pink);
  p.dots([[6, 22], [10, 25], [20, 25], [25, 21]], r.pink[1]).dots([[6, 23], [20, 26]], r.pink[2]);
  p.dots([[8, 10], [9, 10], [13, 7], [13, 8]], r.yellow[0]).dots([[20, 7], [21, 8], [24, 13], [24, 14]], r.teal[1]);
  p.dots([[7, 16], [8, 17], [12, 22], [13, 22]], r.blue[0]).dots([[19, 21], [20, 22], [23, 18], [17, 9]], r.white[0]);
});

add("food", "ramen", "Ramen", (p) => {
  p.line(17, 2, 27, 13, r.brown[0]).line(20, 2, 29, 12, r.brown[1]);
  p.shade(ellipse(15.5, 14, 13.5, 4), r.red, { light: [1, 1] });
  p.ellipse(15.5, 14, 11.5, 2.9, r.orange[0]);
  for (let i = 0; i < 4; i++) p.line(6 + i * 3, 14 + (i % 2), 10 + i * 4, 15, r.yellow[0]);
  p.shade(ellipse(10, 12.6, 3.8, 2.6), r.white).ellipse(10, 12.6, 1.7, 1.2, r.orange[1]);
  p.rect(20, 8, 4, 6, r.green[2]).rect(21, 8, 1, 6, r.green[1]);
  p.dots([[16, 13], [17, 13], [15, 15], [18, 15]], r.green[0]);
  p.shade(and(ellipse(15.5, 14.5, 14, 12.5), (_, y) => y > 15), r.red);
  p.rect(10, 26, 12, 3, r.red[2]);
  p.fill(and(ellipse(15.5, 14.5, 14, 12.5), (_, y) => y === 19), r.white[0]);
});

add("food", "pizza", "Pizza slice", (p) => {
  p.shade(polygon([[3, 8], [29, 6], [17, 30]]), r.yellow, { bias: -0.1 });
  p.shade(or(ellipse(5, 7, 3.4, 3), ellipse(27, 6, 3.4, 3), polygon([[4, 4], [28, 2], [29, 9], [4, 10]])), r.brown, { light: [0, -1] });
  p.shade(ellipse(12, 14, 2.8, 2.6), r.red).shade(ellipse(20.5, 13, 2.8, 2.6), r.red).shade(ellipse(17, 21, 2.5, 2.4), r.red);
  p.dots([[16, 12], [16, 11], [13, 19], [14, 18], [22, 18]], r.green[1]);
  p.dots([[12, 22], [12, 23], [12, 24]], r.yellow[0]);
});

add("food", "sushi", "Sushi", (p) => {
  p.shade(or(ellipse(15.5, 21, 12.5, 6), rect(4, 18, 24, 5)), r.white);
  p.dots([[7, 23], [10, 25], [14, 24], [19, 25], [23, 24], [26, 22]], r.white[2]);
  p.shade(or(ellipse(16, 13.5, 14, 5.4), polygon([[2, 13], [30, 11], [29, 19], [3, 19]])), r.orange);
  for (let i = 0; i < 4; i++) p.line(6 + i * 6, 10, 4 + i * 6, 18, r.cream[0]);
  p.shade(rect(13, 9, 6, 17), r.dark);
  p.dots([[14, 12], [14, 13], [14, 14]], r.teal[2]);
});

add("food", "ice-cream", "Ice cream", (p) => {
  p.shade(polygon([[8, 15], [24, 15], [16, 31]]), r.orange, { bias: -0.15 });
  for (let i = -3; i < 5; i++) p.fill(and(polygon([[8, 15], [24, 15], [16, 31]]), (x, y) => x - y === i * 4 - 8 || x + y === i * 4 + 30), r.brown[1]);
  p.shade(ellipse(11, 12, 6.2, 5.8), r.pink).shade(ellipse(21, 12, 6.2, 5.8), r.teal).shade(ellipse(16, 7.4, 6.4, 5.6), r.cream);
  p.dots([[9, 18], [9, 19], [22, 18], [22, 19], [22, 20]], r.pink[1]);
  p.shade(ellipse(17, 2.4, 2.2, 2.2), r.red);
});

add("food", "apple", "Apple", (p) => {
  p.shade(or(ellipse(11, 18, 8.6, 10.2), ellipse(20, 18, 8.6, 10.2)), r.red);
  p.ellipse(15.5, 9, 3, 1.4, r.red[2]);
  p.line(16, 8, 17, 3, r.brown[2]).line(15, 8, 16, 3, r.brown[1]);
  p.shade(ellipse(21.5, 5, 4.2, 2.3), r.green);
  p.dots([[7, 14], [7, 15], [7, 16], [8, 13], [9, 12]], "#ffd0c0");
});

add("food", "cherries", "Cherries", (p) => {
  p.line(19, 3, 9, 17, r.green[2]).line(19, 3, 22, 18, r.green[2]).line(20, 3, 23, 18, r.green[1]);
  p.shade(ellipse(24, 5, 5, 2.6), r.green);
  p.shade(ellipse(9, 22, 6.6, 6.6), r.red).shade(ellipse(22.5, 23.5, 6.4, 6.2), r.red);
  p.dots([[6, 19], [7, 18], [6, 20], [19, 21], [20, 20]], "#ffd0c0");
});

add("food", "cheese", "Cheese", (p) => {
  p.shade(polygon([[2, 17], [22, 6], [30, 13], [30, 17]]), r.yellow, { light: [-1, -2], bias: -0.25 });
  p.shade(rect(2, 17, 28, 10), r.yellow, { bias: 0.15 });
  p.ellipse(8, 22, 2.4, 2.2, r.orange[2]).ellipse(17, 24, 2, 1.8, r.orange[2]).ellipse(24, 20.5, 2.8, 2.2, r.orange[2]);
  p.ellipse(20, 12, 2.6, 1.5, r.orange[1]).ellipse(12, 15, 1.6, 0.9, r.orange[1]);
});

add("food", "watermelon", "Watermelon", (p) => {
  const half = (rx: number, ry: number): Shape => and(ellipse(16, 8, rx, ry), (_, y) => y >= 9);
  p.shade(half(14.4, 19), r.green);
  p.fill(half(12.6, 16.6), r.cream[0]).shade(half(11.6, 15), r.red);
  p.dots([[10, 13], [10, 14], [16, 12], [16, 13], [22, 13], [22, 14], [13, 18], [13, 19], [19, 18], [19, 19], [16, 21]], PIXEL_INK);
});

/* -------------------------------------------------------------------------------------------------------- nature */

add("nature", "tree", "Tree", (p) => {
  p.shade(taper(16, 18, 12, 4, 7), r.brown);
  p.shade(or(ellipse(16, 10, 9, 8), ellipse(9, 15, 6.4, 5.6), ellipse(23, 15, 6.4, 5.6)), r.green, { dither: 0.9 });
  p.dots([[11, 9], [20, 8], [8, 15], [24, 16]], r.red[1]).dots([[10, 9], [19, 8], [7, 15], [23, 16]], r.red[0]);
});

add("nature", "pine", "Pine", (p) => {
  p.shade(rect(14, 25, 4, 5), r.brown);
  for (const [top, half, bottom] of [[14, 12, 26], [8, 10, 19], [2, 7, 12]]) p.shade(polygon([[16, top - 2], [16 + half, bottom], [16 - half, bottom]]), r.teal, { dither: 0.8 });
  p.dots([[14, 5], [13, 6], [12, 12], [11, 13], [10, 18], [9, 19]], r.white[0]);
});

add("nature", "flower", "Flower", (p) => {
  p.rect(15, 16, 2, 14, r.green[2]);
  p.shade(ellipse(10.5, 24, 4.6, 2.2), r.green).shade(ellipse(21, 26, 4.4, 2), r.green);
  for (let i = 0; i < 6; i++) p.shade(ellipse(16 + Math.cos((i * Math.PI) / 3) * 6, 10.5 + Math.sin((i * Math.PI) / 3) * 6, 4, 4), r.pink);
  p.shade(ellipse(16, 10.5, 3.8, 3.8), r.yellow);
});

add("nature", "cactus", "Cactus", (p) => {
  p.shade(or(rect(13, 5, 7, 20), ellipse(16, 5, 3.4, 2.6)), r.green);
  p.shade(or(rect(5, 10, 4, 8), rect(5, 15, 9, 4)), r.green).shade(or(rect(24, 7, 4, 10), rect(19, 14, 9, 4)), r.green);
  p.dots([[15, 8], [15, 12], [15, 16], [18, 10], [18, 14], [6, 12], [25, 10]], r.cream[0]);
  p.shade(ellipse(16, 2.6, 2.2, 1.8), r.pink);
  p.shade(taper(16, 22, 8, 15, 11), r.orange);
  p.shade(rect(7, 21, 19, 3), r.orange);
});

add("nature", "mushroom", "Mushroom", (p) => {
  p.shade(or(taper(16, 17, 11, 8, 11), ellipse(16, 27, 5.6, 2)), r.cream);
  p.shade(and(ellipse(16, 16, 14, 13), (_, y) => y <= 17), r.red);
  p.ellipse(16, 17.6, 10, 1.2, r.cream[2]);
  p.shade(ellipse(10, 10, 2.8, 2.6), r.white).shade(ellipse(20, 8, 3.4, 2.8), r.white).shade(ellipse(25, 14, 2, 1.8), r.white).shade(ellipse(5.5, 15, 1.4, 1.4), r.white);
});

add("nature", "sun", "Sun", (p) => {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const [cx, cy] = [15.5 + Math.cos(a) * 12.4, 15.5 + Math.sin(a) * 12.4];
    p.fill(ellipse(cx, cy, 2.2, 2.2), i % 2 ? r.orange[0] : r.orange[1]);
  }
  p.shade(ellipse(15.5, 15.5, 8.4, 8.4), r.yellow, { dither: 1 });
});

add("nature", "moon", "Moon", (p) => {
  p.shade(and(ellipse(15, 16, 12.4, 12.4), not(ellipse(21.5, 12, 10, 10))), r.cream, { dither: 0.9 });
  p.ellipse(8, 18, 1.6, 1.6, r.cream[2]).ellipse(13, 24, 2, 1.6, r.cream[2]);
  p.stamp(22, 9, ["..a..", ".aba.", "abbba", ".aba.", "..a.."], { a: r.yellow[1], b: r.yellow[0] });
});

add("nature", "cloud", "Rain cloud", (p) => {
  p.shade(or(ellipse(10, 14, 7, 6), ellipse(19, 11, 8, 7.4), ellipse(25, 15.5, 5, 4.6), rect(7, 14, 20, 6)), r.white, { light: [-0.4, -1], dither: 0.9 });
  for (const [x, y] of [[8, 23], [14, 25], [20, 23], [25, 26]]) p.dots([[x, y], [x, y + 1], [x - 1, y + 2], [x - 1, y + 3]], r.blue[1]);
});

add("nature", "mountain", "Mountains", (p) => {
  p.shade(polygon([[14, 27], [23, 8], [32, 27]]), r.dark, { light: [-1, -0.3] });
  p.shade(polygon([[1, 28], [13, 3], [26, 28]]), r.grey, { light: [-1, -0.2], dither: 0.7 });
  p.shade(polygon([[8.6, 12], [13, 3], [17.6, 12], [15, 10.4], [13, 13], [11, 10.4]]), r.white, { light: [-1, 0] });
  p.shade(or(rect(1, 26, 30, 3), ellipse(7, 26, 5, 2), ellipse(23, 26.4, 6, 2)), r.green);
});

add("nature", "fish", "Fish", (p) => {
  p.shade(polygon([[21, 16], [30, 8], [28, 16], [30, 25]]), r.orange);
  p.shade(polygon([[10, 10], [17, 4], [21, 11]]), r.orange, { bias: 0.15 }).shade(polygon([[12, 22], [17, 27], [19, 21]]), r.orange, { bias: 0.25 });
  p.shade(ellipse(13, 16, 11.4, 7.4), r.orange, { dither: 0.9 });
  p.fill(and(ellipse(13, 16, 11.4, 7.4), (x) => (x >= 10 && x <= 11) || (x >= 17 && x <= 18)), r.white[0]);
  p.ellipse(6.4, 14, 1.9, 1.9, r.white[0]).dots([[6, 14], [6, 15]], PIXEL_INK);
  p.dots([[3, 19], [4, 19]], r.orange[2]);
});

/* ------------------------------------------------------------------------------------------------------- objects */

add("objects", "book", "Book", (p) => {
  p.shade(polygon([[5, 5], [22, 3], [26, 5], [27, 25], [9, 29], [5, 27]]), r.blue);
  p.shade(polygon([[8, 26], [26, 23], [26, 27], [9, 29]]), r.cream, { light: [0, -1] });
  p.fill(polygon([[5, 5], [8, 5], [9, 29], [5, 27]]), r.blue[2]);
  p.shade(polygon([[12, 9], [22, 8], [22, 15], [12, 16]]), r.yellow);
  p.line(14, 12, 20, 11, r.brown[1]);
});

add("objects", "clock", "Alarm clock", (p) => {
  p.shade(ellipse(8, 6, 4.4, 3.6), r.teal).shade(ellipse(23, 6, 4.4, 3.6), r.teal);
  p.line(8, 25, 5, 29, r.dark[1]).line(23, 25, 26, 29, r.dark[1]).line(9, 25, 6, 29, r.dark[1]).line(22, 25, 25, 29, r.dark[1]);
  p.shade(ellipse(15.5, 17, 11.4, 11.4), r.teal);
  p.shade(ellipse(15.5, 17, 8.4, 8.4), r.cream, { bias: -0.3 });
  p.dots([[15, 10], [16, 10], [15, 24], [16, 24], [9, 17], [22, 17]], r.brown[2]);
  p.line(15, 17, 15, 12, PIXEL_INK).line(15, 17, 20, 19, r.red[1]);
});

add("objects", "gift", "Gift", (p) => {
  p.shade(rect(4, 14, 24, 14), r.purple).shade(rect(2, 9, 28, 6), r.purple, { bias: -0.15 });
  p.fill(rect(2, 14, 28, 1), r.purple[2]);
  p.shade(rect(13, 9, 6, 19), r.yellow, { light: [-1, 0] });
  p.shade(and(ellipse(10, 6, 5, 3.6), not(ellipse(10, 6, 2, 1.2))), r.yellow).shade(and(ellipse(21, 6, 5, 3.6), not(ellipse(21, 6, 2, 1.2))), r.yellow);
  p.rect(14, 6, 4, 4, r.yellow[2]);
});

add("objects", "key", "Key", (p) => {
  p.shade(and(ellipse(9, 10, 7, 7), not(ellipse(8.5, 9.5, 2.8, 2.8))), r.yellow);
  p.shade(polygon([[12, 16], [15, 13], [29, 27], [26, 30]]), r.yellow);
  p.shade(polygon([[20, 25], [23, 22], [20, 19.4], [17, 22.4]]), r.yellow, { bias: 0.3 });
  p.fill(polygon([[22, 27], [25, 24], [27, 26], [24, 29]]), r.yellow[1]);
  p.rect(20, 25, 3, 3, r.yellow[2]);
});

add("objects", "chest", "Treasure chest", (p) => {
  p.shade(and(ellipse(16, 14, 13.4, 10.4), (_, y) => y <= 14), r.brown);
  p.shade(rect(3, 15, 27, 13), r.brown);
  p.rect(3, 14, 27, 2, PIXEL_INK);
  for (const x of [5, 25]) p.shade(and(rect(x, 4, 3, 24), or(ellipse(16, 14, 13.4, 10.4), rect(3, 15, 27, 13))), r.yellow);
  p.fill(rect(3, 14, 27, 1), PIXEL_INK);
  p.shade(rect(13, 12, 7, 8), r.yellow);
  p.rect(16, 15, 1, 3, PIXEL_INK).dots([[15, 15], [17, 15]], PIXEL_INK);
});

add("objects", "potion", "Potion", (p) => {
  p.shade(rect(13, 2, 7, 4), r.brown);
  p.shade(or(rect(13, 6, 7, 6), ellipse(16, 20, 10.4, 9.4)), r.white, { bias: 0.1 });
  p.shade(and(ellipse(16, 20, 8.6, 7.8), (x, y) => y > 17 + (x % 5 === 0 ? 1 : 0)), r.purple);
  p.ellipse(16, 18, 8, 1.2, r.purple[0]);
  p.dots([[12, 22], [19, 24], [16, 21], [20, 20]], r.pink[0]).dots([[9, 15], [9, 16], [10, 14]], "#ffffff");
  p.rect(12, 10, 9, 2, r.yellow[1]);
});

add("objects", "gem", "Gem", (p) => {
  p.fill(polygon([[2, 12], [9, 4], [23, 4], [30, 12], [16, 30]]), r.teal[1]);
  p.fill(polygon([[2, 12], [9, 4], [12, 12]]), r.teal[0]).fill(polygon([[9, 4], [23, 4], [16, 12]]), "#d6fff6");
  p.fill(polygon([[12, 12], [20, 12], [16, 30]]), r.teal[0]).fill(polygon([[20, 12], [30, 12], [16, 30]]), r.teal[2]);
  p.fill(polygon([[23, 4], [30, 12], [20, 12]]), r.teal[1]);
  p.dots([[8, 8], [9, 7], [10, 6]], "#ffffff");
});

add("objects", "crown", "Crown", (p) => {
  p.shade(polygon([[3, 8], [10, 17], [16, 5], [22, 17], [29, 8], [27, 24], [5, 24]]), r.yellow, { dither: 0.8 });
  p.shade(rect(5, 23, 22, 5), r.yellow, { bias: 0.3 });
  p.shade(ellipse(3, 7, 1.9, 1.9), r.red).shade(ellipse(16, 4, 2, 2), r.red).shade(ellipse(28.5, 7, 1.9, 1.9), r.red);
  p.shade(ellipse(16, 25, 2, 1.6), r.red).shade(ellipse(10, 25, 1.4, 1.2), r.blue).shade(ellipse(22, 25, 1.4, 1.2), r.blue);
});

add("objects", "lamp", "Desk lamp", (p) => {
  p.shade(ellipse(12, 28, 8, 2.2), r.dark);
  p.line(12, 27, 6, 16, r.grey[2]).line(13, 27, 7, 16, r.grey[1]).line(6, 16, 15, 7, r.grey[2]).line(7, 16, 16, 7, r.grey[1]);
  p.ellipse(6.5, 16, 1.8, 1.8, r.red[2]);
  p.shade(polygon([[13, 8], [20, 3], [29, 11], [19, 17]]), r.red);
  p.fill(polygon([[19, 17], [29, 11], [29, 13], [20, 18]]), r.yellow[0]);
}, (p) => {
  const beam = and(polygon([[20, 19], [30, 14], [32, 30], [22, 30]]), (x, y) => !p.get(x, y));
  p.speckle(beam, "#f7b733", 0.5);
});

add("objects", "letter", "Letter", (p) => {
  p.shade(rect(2, 7, 28, 19), r.cream);
  p.shade(polygon([[2, 7], [30, 7], [16, 19]]), r.cream, { bias: -0.35 });
  p.line(2, 8, 16, 19, r.cream[2]).line(29, 8, 16, 19, r.cream[2]).line(3, 25, 11, 17, r.cream[2]).line(28, 25, 20, 17, r.cream[2]);
  p.shade(ellipse(16, 18, 4, 3.8), r.red);
  p.dots([[15, 17], [17, 17], [14, 18], [15, 18], [16, 18], [17, 18], [18, 18], [15, 19], [16, 19], [17, 19], [16, 20]], r.red[2]);
});

/* ---------------------------------------------------------------------------------------------------------- tech */

add("tech", "computer", "Computer", (p) => {
  p.shade(rect(4, 2, 24, 19), r.cream).shade(rect(7, 5, 18, 12), r.dark);
  p.fill(rect(8, 6, 16, 10), "#173a3a");
  p.rect(10, 8, 6, 1, r.green[0]).rect(10, 10, 9, 1, r.green[0]).rect(12, 12, 8, 1, r.green[0]).rect(10, 14, 2, 1, r.green[0]);
  p.dots([[24, 19], [25, 19]], r.red[1]);
  p.shade(rect(12, 21, 8, 3), r.grey).shade(polygon([[4, 24], [28, 24], [31, 30], [1, 30]]), r.cream, { light: [0, -1] });
  for (let y = 26; y < 29; y++) for (let x = 5 + ((y + 1) % 2); x < 27; x += 2) p.dots([[x, y]], r.cream[2]);
});

add("tech", "phone", "Phone", (p) => {
  p.shade(or(rect(9, 2, 15, 28), rect(8, 3, 17, 26)), r.dark);
  p.shade(rect(10, 6, 13, 19), r.blue, { light: [0, -1], dither: 1 });
  p.fill(and(ellipse(13, 25, 8, 6), rect(10, 6, 13, 19)), r.green[1]).fill(and(ellipse(22, 26, 6, 5), rect(10, 6, 13, 19)), r.green[2]);
  p.ellipse(19, 10, 2, 2, r.yellow[0]);
  p.rect(14, 4, 5, 1, r.dark[0]).rect(15, 27, 3, 1, r.grey[1]);
});

add("tech", "camera", "Camera", (p) => {
  p.shade(rect(10, 5, 12, 5), r.grey).shade(rect(2, 9, 28, 18), r.dark);
  p.shade(rect(2, 9, 28, 5), r.grey, { light: [0, -1] });
  p.shade(ellipse(16, 18, 7.6, 7.6), r.grey).ellipse(16, 18, 5.8, 5.8, PIXEL_INK).shade(ellipse(16, 18, 4.6, 4.6), r.blue);
  p.dots([[13, 16], [14, 15], [14, 16]], "#ffffff").rect(24, 10, 4, 3, r.yellow[0]).rect(4, 7, 4, 2, r.red[1]);
});

add("tech", "joystick", "Joystick", (p) => {
  p.shade(rect(14, 8, 4, 13), r.grey, { light: [-1, 0] }).shade(ellipse(16, 6, 5, 4.8), r.red);
  p.dots([[13, 4], [14, 3], [13, 5]], "#ffd0c0");
  p.shade(polygon([[5, 19], [27, 19], [31, 29], [1, 29]]), r.dark, { light: [0, -1] });
  p.ellipse(16, 20, 4.4, 1.8, PIXEL_INK).shade(ellipse(24, 24, 2.6, 1.8), r.yellow).shade(ellipse(8, 24, 2.6, 1.8), r.teal);
});

add("tech", "radio", "Radio", (p) => {
  p.line(24, 8, 29, 1, r.grey[1]).line(8, 8, 10, 4, r.brown[2]).line(10, 4, 20, 4, r.brown[2]).line(20, 4, 22, 8, r.brown[2]);
  p.shade(rect(2, 8, 28, 20), r.orange).fill(rect(2, 25, 28, 3), r.orange[2]);
  p.shade(ellipse(10, 18, 6.2, 6.2), r.dark);
  for (let y = 13; y < 24; y++) for (let x = 5; x < 16; x++) if (ellipse(10, 18, 5, 5)(x, y) && (x + y) % 2 === 0) p.dots([[x, y]], r.grey[1]);
  p.shade(rect(18, 11, 10, 5), r.cream).line(23, 11, 25, 15, r.red[1]);
  p.shade(ellipse(20, 21, 2.2, 2.2), r.cream).shade(ellipse(26, 21, 2.2, 2.2), r.cream);
});

add("tech", "floppy", "Floppy disk", (p) => {
  p.shade(or(rect(3, 3, 24, 26), rect(3, 6, 26, 23)), r.blue);
  p.shade(rect(9, 3, 14, 9), r.grey).rect(18, 5, 3, 5, r.blue[2]);
  p.shade(rect(7, 16, 18, 13), r.cream, { bias: -0.2 });
  p.rect(10, 19, 12, 1, r.cream[2]).rect(10, 22, 12, 1, r.cream[2]).rect(10, 25, 7, 1, r.cream[2]);
});

add("tech", "robot", "Robot", (p) => {
  p.rect(15, 1, 2, 4, r.grey[2]).shade(ellipse(16, 2, 2, 1.8), r.red);
  p.shade(rect(6, 5, 20, 13), r.teal).shade(rect(9, 8, 14, 7), r.dark);
  p.rect(11, 10, 3, 3, r.yellow[0]).rect(18, 10, 3, 3, r.yellow[0]);
  p.rect(3, 9, 3, 5, r.grey[1]).rect(26, 9, 3, 5, r.grey[1]);
  p.shade(rect(8, 19, 16, 8), r.teal, { bias: 0.15 }).rect(13, 21, 6, 3, r.cream[0]).dots([[14, 22], [16, 22]], r.red[1]);
  p.shade(rect(3, 19, 4, 7), r.grey).shade(rect(25, 19, 4, 7), r.grey).shade(rect(9, 27, 5, 3), r.dark).shade(rect(18, 27, 5, 3), r.dark);
});

add("tech", "rocket", "Rocket", (p) => {
  p.shade(polygon([[10, 17], [4, 22], [4, 28], [11, 25]]), r.red).shade(polygon([[21, 17], [28, 22], [28, 28], [21, 25]]), r.red, { bias: 0.3 });
  p.fill(polygon([[12, 25], [20, 25], [16, 32]]), r.orange[1]).fill(polygon([[14, 25], [18, 25], [16, 30]]), r.yellow[0]);
  p.shade(or(ellipse(16, 14, 6, 12.6), rect(10, 14, 12, 11)), r.white, { light: [-1, -0.2] });
  p.shade(and(ellipse(16, 14, 6, 12.6), (_, y) => y < 8), r.red, { light: [-1, 0] });
  p.shade(ellipse(16, 14, 3.2, 3.2), r.dark).shade(ellipse(16, 14, 2.1, 2.1), r.blue);
  p.rect(10, 22, 12, 2, r.grey[1]);
});

add("tech", "battery", "Battery", (p) => {
  p.shade(rect(12, 2, 8, 3), r.grey).shade(or(rect(8, 5, 16, 25), rect(7, 6, 18, 23)), r.dark);
  p.fill(rect(9, 8, 14, 19), "#15262a");
  for (let i = 0; i < 3; i++) p.shade(rect(10, 9 + i * 6, 12, 5), i ? r.green : r.dark);
  p.fill(polygon([[18, 8], [11, 18], [15, 18], [13, 27], [21, 15], [17, 15]]), r.yellow[0]);
});

add("tech", "headphones", "Headphones", (p) => {
  p.shade(and(ellipse(16, 17, 12.6, 14), not(ellipse(16, 18, 9.4, 11.4)), (_, y) => y < 18), r.dark);
  p.shade(or(rect(2, 16, 6, 11), rect(1, 18, 8, 7)), r.pink).shade(or(rect(24, 16, 6, 11), rect(23, 18, 8, 7)), r.pink);
  p.rect(9, 17, 2, 9, r.dark[2]).rect(21, 17, 2, 9, r.dark[2]);
  p.dots([[3, 18], [3, 19], [25, 18], [25, 19]], "#ffe3ee");
});

/** Every drawing, by category then in the order above. */
export const pixelDrawings: readonly GalleryDrawing[] = list;

export const pixelCategories: readonly PixelCategory[] = ["food", "nature", "objects", "tech"];

/** One drawing by its id. Throws when there is none, so a typo never renders an empty box. */
export function pixelDrawing(id: string): GalleryDrawing {
  const found = list.find((d) => d.id === id);
  if (!found) throw new Error(`pleate: there is no pixel drawing called "${id}"`);
  return found;
}
