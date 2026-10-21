// Window scroll helpers for bars: whether the page has scrolled past a threshold, and the last scroll direction.
"use client";

import { useEffect, useState, type RefObject } from "react";

export function useScrolled(threshold = 1, enabled = true, container?: RefObject<HTMLElement | null>) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const target: HTMLElement | Window = container?.current ?? window;
    const read = () => (target instanceof Window ? target.scrollY : target.scrollTop);
    const update = () => setScrolled(read() > threshold);
    update();
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, [threshold, enabled, container]);
  return scrolled;
}

/** "down" after scrolling down more than `tolerance` px past `offset`, "up" as soon as the page moves back up. */
export function useScrollDirection({ offset = 64, tolerance = 6, enabled = true } = {}) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  useEffect(() => {
    if (!enabled) return;
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (y < offset) setDirection("up");
        else if (y - last > tolerance) setDirection("down");
        else if (last - y > tolerance) setDirection("up");
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [offset, tolerance, enabled]);
  return direction;
}
