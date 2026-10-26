// Copies text to the clipboard and remembers for a moment that it did, for "Copied" feedback on copy buttons.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopy(resetAfter = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetAfter);
      return true;
    },
    [resetAfter],
  );
  return { copied, copy };
}
