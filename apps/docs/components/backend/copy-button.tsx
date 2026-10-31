"use client";

import { Check, Copy } from "lucide-react";
import { IconButton } from "pleate";
import { useEffect, useRef, useState } from "react";

export function CopyButton({ text, className, variant = "plain" }: { text: string; className?: string; variant?: "plain" | "gray" }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <IconButton
      aria-label={copied ? "Copied" : "Copy code"}
      size="sm"
      variant={variant}
      tone="neutral"
      className={className}
      onClick={() => {
        // No clipboard on insecure origins, and a refused write must not say "Copied".
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1400);
        }, () => {});
      }}
      icon={copied ? <Check /> : <Copy />}
    />
  );
}
