// A working example on a Backend page: the demo runs against the mock backend, the Code tab shows its own file.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { DemoFrame } from "@/components/demo-frame";
import { BackendDemo } from "./backend-demo";

function source(file: string) {
  const full = path.join(process.cwd(), "demos", "backend", `${file}.tsx`);
  return readFileSync(full, "utf8").replace(/^"use client";\n\n/, "").trim();
}

export function LiveDemo({
  file,
  title,
  description,
  signIn,
  hint,
  children,
}: {
  /** File name in demos/backend, without extension. */
  file: string;
  title: string;
  description?: string;
  signIn?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="my-10">
      <DemoFrame id={`demo-${file}`} title={title} description={description} code={source(file)} align="stretch">
        <BackendDemo signIn={signIn} hint={hint}>
          {children}
        </BackendDemo>
      </DemoFrame>
    </div>
  );
}
