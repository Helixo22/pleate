import assert from "node:assert/strict";
import { test } from "node:test";
import { bayer, bufferToPaths, PixelBuffer, shapes } from "./buffer.ts";

const areaOf = (d: string) => [...d.matchAll(/h(\d+)v(\d+)/g)].reduce((n, m) => n + Number(m[1]) * Number(m[2]), 0);

test("paths cover every pixel of a color exactly once", () => {
  const p = new PixelBuffer(12);
  p.shade(shapes.ellipse(5, 5, 4, 3), ["#aaa", "#777", "#333"]).rect(0, 10, 12, 2, "#f00");
  const paths = bufferToPaths(p);
  for (const { color, d } of paths) {
    const ink = p.palette.indexOf(color) + 1;
    assert.equal(areaOf(d), p.data.filter((v) => v === ink).length);
  }
});

test("a flat rectangle becomes one rectangle", () => {
  const p = new PixelBuffer(8).rect(1, 2, 5, 4, "#000");
  assert.deepEqual(bufferToPaths(p), [{ color: "#000", d: "M1 2h5v4h-5z" }]);
});

test("the outline stays outside the drawing and skips corners by default", () => {
  const p = new PixelBuffer(5).rect(2, 2, 1, 1, "#fff").outline("#000");
  assert.equal(p.data.filter((v) => v === p.ink("#000")).length, 4);
  assert.equal(p.get(2, 2), p.ink("#fff"));
});

test("bayer thresholds stay inside 0..1 and are all different", () => {
  const all = new Set<number>();
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) all.add(bayer(x, y));
  assert.equal(all.size, 16);
  assert.ok([...all].every((v) => v > 0 && v < 1));
});

test("drawing outside the buffer is ignored and colors are reused", () => {
  const p = new PixelBuffer(4).line(-5, 1, 9, 1, "#111").dots([[99, 99]], "#111");
  assert.equal(p.palette.length, 1);
  assert.equal(p.data.filter(Boolean).length, 4);
});

test("draw() remaps the colors of the other drawing", () => {
  const a = new PixelBuffer(4, 4, ["#1", "#2"]);
  a.draw(new PixelBuffer(1).rect(0, 0, 1, 1, "#2"), 3, 3);
  assert.equal(a.get(3, 3), 2);
});

test("shapes combine", () => {
  const ring = shapes.and(shapes.rect(0, 0, 4, 4), shapes.not(shapes.rect(1, 1, 2, 2)));
  assert.equal(ring(0, 0), true);
  assert.equal(ring(1, 1), false);
  assert.equal(shapes.or(ring, shapes.rect(1, 1, 1, 1))(1, 1), true);
});
