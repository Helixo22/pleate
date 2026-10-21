"use client";

import { FileUpload } from "pleate/file-upload";
import { useEffect, useState } from "react";

export default function Demo() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  // Fake upload: every new file climbs to 100%.
  useEffect(() => {
    const pending = files.filter((f) => progress[f.name] === undefined);
    if (pending.length) setProgress((p) => ({ ...p, ...Object.fromEntries(pending.map((f) => [f.name, 0])) }));
    const id = setInterval(() => {
      setProgress((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.min(100, v + 7 + Math.random() * 10)])));
    }, 250);
    return () => clearInterval(id);
  }, [files, progress]);
  return (
    <div className="grid w-full max-w-lg gap-8">
      <FileUpload value={files} onValueChange={setFiles} accept="image/*,.pdf" maxSize={10 * 1024 * 1024} maxFiles={5} progress={progress} />
      <FileUpload variant="button" multiple={false} accept=".pdf" buttonLabel="Attach itinerary (PDF)" />
    </div>
  );
}
