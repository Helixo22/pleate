import type { Metadata } from "next";
import { CodeLine, PageHeader } from "@/components/page-header";
import { ThemingPlayground } from "@/components/theming-playground";

export const metadata: Metadata = { title: "Theming" };

export default function ThemingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Getting started" title="Theming">
        Light, dark or system. Ten palettes, or your own from a single color: pleate derives fills, inks and a full
        tonal scale in OKLCH and checks every pair for WCAG AA contrast.
      </PageHeader>
      <ThemingPlayground />
      <section className="mt-14 grid gap-4">
        <h2 className="text-title2">In code</h2>
        <CodeLine>{`"use client";
import { useTheme } from "pleate/theme";

const { theme, setTheme, palette, setPalette, setCustomColor } = useTheme();
setTheme("dark");          // "light" | "dark" | "system"
setPalette("teal");        // any preset name
setCustomColor("#ff2d55"); // generates and applies a palette`}</CodeLine>
        <CodeLine>{`// Server side, or a fixed brand palette in your own CSS
import { createPalette, paletteToCss } from "pleate/theme";
const css = paletteToCss('[data-palette="brand"]', createPalette("#0a84ff"));`}</CodeLine>
        <CodeLine>{`<!-- Scope a palette or theme to any subtree -->
<section data-palette="rose" data-theme="dark">…</section>`}</CodeLine>
      </section>
    </div>
  );
}
