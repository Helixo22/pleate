"use client";

import { Check, Copy } from "lucide-react";
import { IconButton } from "pleate";
import { useState } from "react";

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      aria-label={copied ? "Copied" : "Copy code"}
      size="sm"
      variant="plain"
      tone="neutral"
      className={className}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      icon={copied ? <Check /> : <Copy />}
    />
  );
}
