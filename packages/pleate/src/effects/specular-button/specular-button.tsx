// SpecularButton: a glass capsule whose rim catches the light. A bright arc on the edge turns to face the pointer and
// a soft highlight glides toward it inside. Without a fine pointer (touch) or with reduced motion the light rests
// at the top left. It is a plain <button>.
"use client";

import { type ButtonHTMLAttributes, type CSSProperties, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";

export type SpecularButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "md" | "lg";
};

export function SpecularButton({ size = "md", className, style, children, onPointerMove, onPointerLeave, ...props }: SpecularButtonProps) {
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e);
    if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const s = e.currentTarget.style;
    s.setProperty("--a", `${(Math.atan2(y - r.height / 2, x - r.width / 2) * 180) / Math.PI + 90}deg`);
    s.setProperty("--hx", `${x}px`);
    s.setProperty("--hy", `${y}px`);
    s.setProperty("--ho", "1");
  };
  return (
    <button
      type="button"
      onPointerMove={move}
      onPointerLeave={(e) => {
        onPointerLeave?.(e);
        e.currentTarget.style.setProperty("--a", "-45deg");
        e.currentTarget.style.setProperty("--ho", "0");
      }}
      className={cn(
        "group pl-focus-ring pl-touch relative isolate inline-flex items-center justify-center gap-2 rounded-full font-semibold text-fg transition-transform duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        size === "lg" ? "h-14 px-8 text-headline" : "h-11 px-6 text-callout",
        className,
      )}
      style={{ "--a": "-45deg", ...style } as CSSProperties}
      {...props}
    >
      <span aria-hidden="true" className="absolute inset-0 -z-[1] rounded-full bg-[color-mix(in_oklab,var(--pl-surface)_45%,transparent)] backdrop-blur-xl [box-shadow:var(--pl-shadow-md)]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full p-[1.5px] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] transition-[background] duration-300"
        style={{ background: "conic-gradient(from calc(var(--a) - 70deg), color-mix(in oklab, var(--pl-fg) 12%, transparent), rgb(255 255 255 / 0.95) 70deg, color-mix(in oklab, var(--pl-fg) 12%, transparent) 140deg, color-mix(in oklab, var(--pl-fg) 12%, transparent))" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden rounded-full opacity-[var(--ho,0)] transition-opacity duration-300"
        style={{ background: "radial-gradient(80px circle at var(--hx) var(--hy), rgb(255 255 255 / 0.35), transparent 70%)" }}
      />
      {children}
    </button>
  );
}
