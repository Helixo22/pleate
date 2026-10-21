// Splits text into words or letters for animation, keeping it readable: the pieces are aria-hidden and the full
// sentence is given once to assistive tech. Spaces stay real spaces so lines wrap naturally.
import type { ReactNode } from "react";

export type SplitBy = "word" | "letter";

export function splitText(text: string, by: SplitBy) {
  return by === "word" ? text.split(/(\s+)/).filter(Boolean) : [...text];
}

export function Accessible({ text, children }: { text: string; children: ReactNode }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{children}</span>
    </>
  );
}

export const isSpace = (s: string) => /^\s+$/.test(s);
