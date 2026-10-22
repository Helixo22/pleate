import { ArrowRight, Accessibility, Palette, Sparkles, Waves } from "lucide-react";
import Link from "next/link";
import { Button } from "pleate/button";
import { CodeLine } from "@/components/page-header";
import { Showcase } from "@/components/showcase";

const FEATURES = [
  { icon: Palette, title: "Palettes at runtime", text: "Ten presets, or a full AA-checked palette generated from a single color in OKLCH." },
  { icon: Waves, title: "Native-feeling motion", text: "Shared springs and iOS easing. Everything stops for reduce motion." },
  { icon: Accessibility, title: "Accessible by default", text: "Radix primitives, keyboard support, visible focus and AA contrast." },
  { icon: Sparkles, title: "Solid, not glass", text: "Opaque surfaces and soft shadows. No blur, no transparency tricks." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="pt-4 pb-14 md:pt-10 md:pb-20">
        <p className="mb-4 text-subhead font-semibold text-accent-ink">pleate · v0.1 · 90+ components</p>
        <h1 className="max-w-4xl text-display-xl">Interfaces that feel native.</h1>
        <p className="mt-6 max-w-2xl text-title3 font-normal text-fg-muted">
          iOS-inspired React components, design tokens and themes for Next.js. Rounded, airy, precise, and yours
          down to the last color.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/components/button">
              Browse components <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="tinted">
            <Link href="/examples/landing">Example landing page</Link>
          </Button>
          <Button asChild size="lg" variant="plain">
            <Link href="/theming">Theming</Link>
          </Button>
        </div>
      </section>

      <Showcase />

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl bg-surface p-6 shadow-xs">
            <span className="mb-4 grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-ink">
              <Icon className="size-5" />
            </span>
            <h2 className="text-headline">{title}</h2>
            <p className="mt-1.5 text-subhead text-fg-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 grid gap-4">
        <h2 className="text-title1">Get started</h2>
        <CodeLine>{"npm install pleate"}</CodeLine>
        <CodeLine>{`/* app/globals.css */
@import "tailwindcss";
@import "pleate/styles.css";
@source "../node_modules/pleate/dist";`}</CodeLine>
        <CodeLine>{`// app/layout.tsx
import { ThemeProvider, ThemeScript } from "pleate/theme";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript defaultPalette="blue" /></head>
      <body><ThemeProvider defaultPalette="blue">{children}</ThemeProvider></body>
    </html>
  );
}`}</CodeLine>
      </section>
    </div>
  );
}
