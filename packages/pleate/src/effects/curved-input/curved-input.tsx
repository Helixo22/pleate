// CurvedInput: a text field bent along an arc. The bar, the typed text, the placeholder, the caret and the round
// submit button all follow the curve. Underneath is a real, invisible <input> laid over the bar, so typing,
// selection, autofill, paste and screen readers work as usual; the SVG only draws what it holds. Enter or the
// button submits.
"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "../../lib/cn.ts";

export type CurvedInputProps = {
  /** Called with the text on Enter or the button. */
  onSubmit?: (value: string) => void;
  /** Accessible name of the field. */
  label: string;
  placeholder?: string;
  defaultValue?: string;
  /** Width of the bar in px (it shrinks to fit narrow parents). */
  width?: number;
  /** How far the middle rises above the ends, px; negative bends it down. */
  curve?: number;
  /** Bar thickness, px. */
  thickness?: number;
  /** Accessible name of the submit button. */
  submitLabel?: string;
  /** Clear the field after submitting. */
  clearOnSubmit?: boolean;
  className?: string;
};

export function CurvedInput({
  onSubmit,
  label,
  placeholder = "Type something",
  defaultValue = "",
  width = 520,
  curve = 60,
  thickness = 56,
  submitLabel = "Send",
  clearOnSubmit = true,
  className,
}: CurvedInputProps) {
  const id = useId().replace(/:/g, "");
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState(defaultValue.length);
  const [caretPos, setCaretPos] = useState<{ x: number; y: number; a: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const path = useRef<SVGPathElement>(null);
  const text = useRef<SVGTextElement>(null);

  const pad = thickness / 2;
  const height = Math.abs(curve) + thickness + 8;
  const y0 = curve >= 0 ? height - pad - 4 : pad + 4;
  const button = thickness - 12;
  // Quadratic curve from end to end; the control point is twice the rise so the middle reaches `curve`.
  const d = `M ${pad} ${y0} Q ${width / 2} ${y0 - curve * 2} ${width - pad} ${y0}`;
  const textStart = 18;

  // Caret: arc length of the text before the selection, then the point and tangent there.
  useLayoutEffect(() => {
    const p = path.current;
    const t = text.current;
    if (!p || !t) return;
    let len = 0;
    try {
      len = caret > 0 && value ? t.getSubStringLength(0, Math.min(caret, value.length)) : 0;
    } catch {
      len = 0;
    }
    const at = Math.min(p.getTotalLength() - button - 8, textStart + len);
    const a = p.getPointAtLength(at);
    const b = p.getPointAtLength(at + 1);
    setCaretPos({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }, [caret, value, d, button]);

  const syncCaret = () => setCaret(input.current?.selectionStart ?? value.length);
  useEffect(() => {
    document.addEventListener("selectionchange", syncCaret);
    return () => document.removeEventListener("selectionchange", syncCaret);
  });

  const end = path.current?.getPointAtLength(path.current.getTotalLength() - button / 2 - 6);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit?.(value);
    if (clearOnSubmit) setValue("");
  };

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)} style={{ maxWidth: width }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={0} y={0} width={width - pad - button - 8} height={height} />
          </clipPath>
        </defs>
        <path d={d} fill="none" stroke="var(--pl-separator)" strokeWidth={thickness + 2} strokeLinecap="round" />
        <path ref={path} id={`${id}-arc`} d={d} fill="none" stroke="var(--pl-surface-2)" strokeWidth={thickness} strokeLinecap="round" />
        {focused && <path d={d} fill="none" stroke="var(--pl-ring)" strokeWidth={thickness + 6} strokeLinecap="round" opacity={0.35} className="pointer-events-none" />}
        {focused && <path d={d} fill="none" stroke="var(--pl-surface-2)" strokeWidth={thickness} strokeLinecap="round" />}
        <text ref={text} clipPath={`url(#${id}-clip)`} dominantBaseline="central" fontSize={17} fill={value ? "var(--pl-fg)" : "var(--pl-fg-subtle)"} xmlSpace="preserve">
          <textPath href={`#${id}-arc`} startOffset={textStart}>
            {value || placeholder}
          </textPath>
        </text>
        {focused && caretPos && (value || caret === 0) && (
          <line
            x1={0}
            y1={-11}
            x2={0}
            y2={11}
            stroke="var(--pl-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            transform={`translate(${caretPos.x} ${caretPos.y}) rotate(${caretPos.a})`}
            className="animate-[pl-blink_1s_steps(1)_infinite] motion-reduce:animate-none"
          />
        )}
      </svg>
      <input
        ref={input}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value);
          setCaret(event.target.selectionStart ?? event.target.value.length);
        }}
        onFocus={() => {
          setFocused(true);
          syncCaret();
        }}
        onBlur={() => setFocused(false)}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        // Invisible but present: the SVG above shows the text.
        className="absolute inset-0 size-full cursor-text bg-transparent px-6 text-transparent caret-transparent outline-none selection:bg-transparent placeholder:text-transparent"
      />
      {end && (
        <button
          type="submit"
          aria-label={submitLabel}
          className="pl-focus-ring absolute grid -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-accent text-on-accent transition-transform active:scale-95"
          style={{ left: `${(end.x / width) * 100}%`, top: `${(end.y / height) * 100}%`, width: button, height: button }}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
          </svg>
        </button>
      )}
    </form>
  );
}
