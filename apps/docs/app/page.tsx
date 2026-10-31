import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "pleate/button";
import { CodeLine } from "@/components/page-header";
import { Showcase } from "@/components/showcase";

const FEATURES = [
  { title: "Palettes at runtime", text: "Eleven presets, or a full AA-checked palette generated from one color in OKLCH." },
  { title: "Motion with a reason", text: "One easing curve and short durations. Everything stops for reduced motion." },
  { title: "Accessible by default", text: "Radix primitives, keyboard support, visible focus and AA contrast." },
  { title: "Solid surfaces", text: "Hairline borders, no blur, shadows only on things that float." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid items-center gap-10 pt-2 pb-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:pt-6">
        <div>
          <p className="mb-4 font-mono text-caption1 text-fg-subtle">pleate 0.1 · 100+ components</p>
          <h1 className="text-display">React components for Next.js, with a backend to match</h1>
          <p className="mt-5 max-w-xl text-[1.0625rem] leading-7 text-fg-muted">
            Tokens, themes and accessible components on Radix and Tailwind v4, plus a Django and MongoDB backend
            for auth, billing and AI chat that speaks to the same UI.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/components/button">
                Browse components <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="plain" tone="neutral">
              <Link href="/examples/landing">Example landing page</Link>
            </Button>
          </div>
        </div>
        <Showcase />
      </section>

      <section className="border-t border-separator">
        <ol className="grid sm:grid-cols-2">
          {FEATURES.map(({ title, text }, i) => (
            <li key={title} className="flex gap-4 border-b border-separator py-5 sm:odd:pe-8 sm:even:ps-8 sm:even:border-s">
              <span className="font-mono text-caption1 text-fg-subtle pt-1">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-headline">{title}</h2>
                <p className="mt-1 text-subhead text-fg-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <div>
          <h2 className="text-title1">Get started</h2>
          <p className="mt-2 text-subhead text-fg-muted">Install, import the styles, wrap the app.</p>
        </div>
        <div className="grid gap-3">
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
      <head><ThemeScript /></head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}`}</CodeLine>
        </div>
      </section>
    </div>
  );
}
