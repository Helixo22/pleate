// Timeline: a list of cues, each pinning a set of values at a point from 0 to 1, sampled at any point in between.
// Values a cue leaves out carry over from the cue before, so a cue only names what changes. Every value is a number
// or a fixed-length list of numbers (a position, a color, a target). Sampling writes into one object the timeline owns
// and allocates nothing, so it is safe to call on every frame. Pure: no DOM, no React.

export type TimelineValue = number | readonly number[];
export type TimelineValues = Record<string, TimelineValue>;

/** Maps 0..1 to 0..1. */
export type Easing = (t: number) => number;

export type Cue<V extends TimelineValues> = {
  /** Where the cue sits, 0 to 1. */
  at: number;
  /** The values that change at this cue. The rest carry over. */
  values?: Partial<V>;
  /** The curve of the stretch that ends at this cue. Defaults to the timeline's easing. */
  ease?: Easing;
};

/** A writable copy of the values: what `sample` returns. */
export type Sampled<V extends TimelineValues> = { -readonly [K in keyof V]: V[K] extends number ? number : number[] };

export type Timeline<V extends TimelineValues> = {
  /** The values at `t` (clamped to the first and last cue). The same object every call: copy it to keep a value. */
  sample(t: number): Sampled<V>;
  /** The cue points, sorted. */
  readonly stops: readonly number[];
};

export const clamp01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

export const easings = {
  linear: (t: number) => t,
  /** smoothstep: eases in and out, the default. */
  smooth: (t: number) => t * t * (3 - 2 * t),
  /** smootherstep: flatter at both ends, for camera moves that should settle. */
  smoother: (t: number) => t * t * t * (t * (t * 6 - 15) + 10),
  out: (t: number) => 1 - (1 - t) ** 3,
  in: (t: number) => t * t * t,
} satisfies Record<string, Easing>;

/** Where `t` is inside [from, to], as 0..1. Splits one progress value into chapters. */
export function range(t: number, from: number, to: number) {
  return to === from ? (t >= to ? 1 : 0) : clamp01((t - from) / (to - from));
}

export function createTimeline<V extends TimelineValues>(base: V, cues: readonly Cue<V>[], options: { ease?: Easing } = {}): Timeline<V> {
  const keys = Object.keys(base) as (keyof V & string)[];
  const lengths = keys.map((k) => (typeof base[k] === "number" ? -1 : (base[k] as readonly number[]).length));
  const fallback = options.ease ?? easings.smooth;
  const sorted = [...cues].sort((a, b) => a.at - b.at);
  if (sorted.length === 0) sorted.push({ at: 0 });

  // Resolve every cue to the full set of values: the base, then each cue's changes on top of the one before.
  // Stored flat (one Float64Array per cue) so sampling is a single loop over numbers.
  const width = lengths.reduce((n, l) => n + (l < 0 ? 1 : l), 0);
  const frames: Float64Array[] = [];
  const eases: Easing[] = [];
  let prev = new Float64Array(width);
  writeFlat(base, prev);
  for (const cue of sorted) {
    const next = new Float64Array(prev);
    if (cue.values) {
      let o = 0;
      keys.forEach((k, i) => {
        const v = cue.values![k];
        const len = lengths[i];
        if (v !== undefined) {
          if (len < 0) {
            if (typeof v !== "number") throw new TypeError(`pleate timeline: "${k}" is a number in the base, got a list at ${cue.at}`);
            next[o] = v;
          } else {
            if (typeof v === "number" || v.length !== len) throw new TypeError(`pleate timeline: "${k}" needs ${len} numbers at ${cue.at}`);
            for (let j = 0; j < len; j++) next[o + j] = v[j];
          }
        }
        o += len < 0 ? 1 : len;
      });
    }
    frames.push(next);
    eases.push(cue.ease ?? fallback);
    prev = next;
  }
  const stops = sorted.map((c) => c.at);

  function writeFlat(values: V, into: Float64Array) {
    let o = 0;
    keys.forEach((k, i) => {
      const v = values[k];
      if (lengths[i] < 0) into[o++] = v as number;
      else for (const n of v as readonly number[]) into[o++] = n;
    });
  }

  const out = {} as Record<string, number | number[]>;
  for (let i = 0; i < keys.length; i++) out[keys[i]] = lengths[i] < 0 ? 0 : new Array<number>(lengths[i]).fill(0);
  const scratch = new Float64Array(width);
  let last = 0; // the segment found last time: scrolling moves a little each frame, so the search starts there

  function sample(t: number) {
    const n = stops.length;
    if (n === 1 || t <= stops[0]) scratch.set(frames[0]);
    else if (t >= stops[n - 1]) scratch.set(frames[n - 1]);
    else {
      let i = Math.min(last, n - 2);
      while (i > 0 && t < stops[i]) i--;
      while (i < n - 2 && t >= stops[i + 1]) i++;
      last = i;
      const span = stops[i + 1] - stops[i];
      const k = span > 0 ? eases[i + 1](clamp01((t - stops[i]) / span)) : 1;
      const a = frames[i];
      const b = frames[i + 1];
      for (let j = 0; j < width; j++) scratch[j] = a[j] + (b[j] - a[j]) * k;
    }
    let o = 0;
    for (let i = 0; i < keys.length; i++) {
      const len = lengths[i];
      if (len < 0) out[keys[i]] = scratch[o++];
      else {
        const list = out[keys[i]] as number[];
        for (let j = 0; j < len; j++) list[j] = scratch[o++];
      }
    }
    return out as Sampled<V>;
  }

  return { sample, stops };
}
