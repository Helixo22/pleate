// Run with: node --test packages/pleate/src/effects/scroll-scene/timeline.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createTimeline, easings, range } from "./timeline.ts";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
const nearList = (actual: number[], expected: number[]) => expected.forEach((e, i) => near(actual[i], e));

const base = { fov: 30, cam: [0, 0, 4] as readonly number[] };

test("clamps before the first cue and after the last", () => {
  const tl = createTimeline(base, [{ at: 0.2, values: { fov: 40 } }, { at: 0.8, values: { fov: 60 } }], { ease: easings.linear });
  near(tl.sample(0).fov, 40);
  near(tl.sample(1).fov, 60);
});

test("blends linearly between cues", () => {
  const tl = createTimeline(base, [{ at: 0 }, { at: 1, values: { fov: 50, cam: [2, 4, 0] } }], { ease: easings.linear });
  const s = tl.sample(0.5);
  near(s.fov, 40);
  nearList(s.cam, [1, 2, 2]);
});

test("values a cue leaves out carry over from the cue before", () => {
  const tl = createTimeline(base, [{ at: 0, values: { fov: 20 } }, { at: 0.5, values: { cam: [1, 1, 1] } }, { at: 1, values: { fov: 80 } }], {
    ease: easings.linear,
  });
  const mid = tl.sample(0.5);
  near(mid.fov, 20);
  nearList(mid.cam, [1, 1, 1]);
  nearList(tl.sample(1).cam, [1, 1, 1]);
});

test("sorts cues and finds the segment when sampling backwards", () => {
  const tl = createTimeline({ x: 0 }, [{ at: 1, values: { x: 3 } }, { at: 0, values: { x: 0 } }, { at: 0.5, values: { x: 1 } }], {
    ease: easings.linear,
  });
  assert.deepEqual(tl.stops, [0, 0.5, 1]);
  near(tl.sample(0.75).x, 2);
  near(tl.sample(0.25).x, 0.5);
  near(tl.sample(0.9).x, 2.6);
});

test("returns the same object every call", () => {
  const tl = createTimeline(base, [{ at: 0 }, { at: 1, values: { fov: 50 } }]);
  const a = tl.sample(0.1);
  const b = tl.sample(0.9);
  assert.equal(a, b);
  assert.equal(a.cam, b.cam);
});

test("per-cue easing applies to the stretch that ends at it", () => {
  const tl = createTimeline({ x: 0 }, [{ at: 0 }, { at: 1, values: { x: 1 }, ease: easings.in }]);
  near(tl.sample(0.5).x, 0.125);
});

test("rejects lists of the wrong length", () => {
  assert.throws(() => createTimeline(base, [{ at: 0, values: { cam: [1, 2] } }]), /needs 3 numbers/);
});

test("range splits progress into chapters", () => {
  near(range(0.1, 0.2, 0.6), 0);
  near(range(0.4, 0.2, 0.6), 0.5);
  near(range(0.9, 0.2, 0.6), 1);
});
