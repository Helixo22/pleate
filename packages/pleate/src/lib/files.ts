// File helpers shared by FileUpload and Composer: the file key, accept matching and image preview URLs.
"use client";

import { useEffect, useState } from "react";

/** The key for a file: name, size and last modified time. */
export const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

/** Whether `file` passes an `accept` attribute value (".pdf,image/*,text/plain"). */
export function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

/** An object URL for an image file, revoked on change and unmount (created in the effect, so StrictMode is safe). */
export function useImageUrl(file: File) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return setUrl(null);
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
