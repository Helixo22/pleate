// A tiny 2D physics for boxes that never rotate: gravity, a floor, two walls and box against box pushes along the
// axis of least overlap. Enough for words that fall and pile up; not a general engine.

export type Body = { x: number; y: number; w: number; h: number; vx: number; vy: number; held?: boolean };

const GRAVITY = 2200; // px/s²
const BOUNCE = 0.25;
const FRICTION = 0.86;

/** Advances every body by dt seconds inside a width × height box (origin top left). */
export function step(bodies: Body[], dt: number, width: number, height: number) {
  for (const b of bodies) {
    if (b.held) continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  // A few passes so stacks settle instead of sinking into each other.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        // A held body acts as infinitely heavy.
        const wa = a.held ? 0 : b.held ? 1 : 0.5;
        const wb = 1 - wa;
        if (ox < oy) {
          const dir = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
          a.x += dir * ox * wa;
          b.x -= dir * ox * wb;
          const v = (a.vx * wb + b.vx * wa) || 0;
          if (!a.held) a.vx = v;
          if (!b.held) b.vx = v;
        } else {
          const dir = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
          a.y += dir * oy * wa;
          b.y -= dir * oy * wb;
          const top = dir < 0 ? a : b;
          const bottom = dir < 0 ? b : a;
          if (!top.held && top.vy > bottom.vy) top.vy = bottom.vy * BOUNCE;
          if (!top.held) top.vx *= FRICTION;
        }
      }
    }
    for (const b of bodies) {
      if (b.held) continue;
      if (b.y + b.h > height) {
        b.y = height - b.h;
        b.vy = b.vy > 0 ? -b.vy * BOUNCE : b.vy;
        if (Math.abs(b.vy) < 40) b.vy = 0;
        b.vx *= FRICTION;
      }
      if (b.x < 0) {
        b.x = 0;
        b.vx = Math.abs(b.vx) * BOUNCE;
      }
      if (b.x + b.w > width) {
        b.x = width - b.w;
        b.vx = -Math.abs(b.vx) * BOUNCE;
      }
    }
  }
}
