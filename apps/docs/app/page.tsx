import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "pleate/button";
import { Card } from "pleate/card";
import { AsciiRipple } from "pleate/effects/ascii-ripple";
import { LogoMarquee } from "pleate/marketing/logo-marquee";
import { CodeLine } from "@/components/page-header";
import { FeaturedEffects, Showcase } from "@/components/showcase";
import { SearchTrigger } from "@/components/site-search";
import { DOCS } from "@/demos";

const COUNT = Object.keys(DOCS).length;

const FIGURES = [
  { label: "Components", value: String(COUNT) },
  { label: "Palettes", value: "11" },
  { label: "React", value: "19" },
  { label: "Tailwind", value: "v4" },
  { label: "Contrast", value: "WCAG AA" },
  { label: "Backend", value: "Django + MongoDB" },
  { label: "Primitives", value: "Radix" },
  { label: "Motion", value: "reduced-motion safe" },
];

const FEATURES = [
  {
    title: "Palettes at runtime",
    text: "Eleven presets, or a full AA-checked palette generated from one color in OKLCH.",
  },
  {
    title: "Motion with a reason",
    text: "One easing curve and short durations. Everything stops for reduced motion.",
  },
  {
    title: "Accessible by default",
    text: "Radix primitives, keyboard support, visible focus and AA contrast.",
  },
  {
    title: "iOS at heart",
    text: "Grouped surfaces, capsule buttons, Dynamic Type sizes, solid colors and no blur.",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <Card padding="none" radius="xl" className="h-9 justify-center">
        <LogoMarquee label="pleate at a glance" gap="0rem" duration={40}>
          {FIGURES.map(({ label, value }) => (
            <span
              key={label}
              className="flex items-baseline gap-2 px-4 whitespace-nowrap"
            >
              <span className="text-caption2 font-bold tracking-wide text-fg-muted uppercase">
                {label}
              </span>
              <span className="pl-tabular text-footnote font-bold text-fg">
                {value}
              </span>
              <span className="ps-2 text-border" aria-hidden="true">
                ·
              </span>
            </span>
          ))}
        </LogoMarquee>
      </Card>

      <section className="relative isolate overflow-hidden rounded-3xl bg-surface shadow-[var(--pl-edge)]">
        {/* The field is quieter behind the copy and fully alive around the preview. */}
        <AsciiRipple baseOpacity={0.3} className="absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,rgb(0_0_0/0.3)_40%,#000)] xl:[mask-image:linear-gradient(100deg,rgb(0_0_0/0.3)_35%,#000_75%)]" />
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 py-7 sm:px-10 sm:py-12 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="mb-4 font-mono text-footnote text-fg-muted">
              pleate 0.2 · React UI for Next.js
            </p>
            <h1 className="mb-3 font-brand text-[2.5rem] leading-[0.95] font-bold tracking-[-0.04em] sm:text-7xl">
              pleate<span className="text-accent-ink">.ui</span>
            </h1>
            <p className="max-w-xl text-body text-fg-muted sm:text-[1.25rem] sm:leading-snug">
              Components, tokens and themes for Next.js, and a Django backend
              that speaks to the same UI. All in one place, clear and
              accessible.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="/components">
                  Browse components <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="plain" tone="neutral">
                <Link href="/examples/landing">Example landing page</Link>
              </Button>
            </div>
            <p className="mt-6 font-mono text-footnote text-fg-muted">
              <span className="pl-tabular text-fg">{COUNT}</span> components
              <span className="px-2 text-fg-subtle" aria-hidden="true">/</span>
              <span className="text-fg">11</span> palettes
            </p>
          </div>
          <Showcase />
        </div>
      </section>

      <SearchTrigger size="lg" label="Search a component, a hook or a page" />

      <section className="border-t border-separator">
        <ol className="grid sm:grid-cols-2">
          {FEATURES.map(({ title, text }, i) => (
            <li
              key={title}
              className="flex gap-4 border-b border-separator py-5 sm:odd:pe-8 sm:even:border-s sm:even:ps-8"
            >
              <span className="pt-1 font-mono text-caption1 text-fg-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-headline">{title}</h2>
                <p className="mt-1 text-subhead text-fg-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="home-effects" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="home-effects" className="text-title3">
            Effects
          </h2>
          <Link href="/components" className="pl-focus-ring inline-flex items-center gap-1 rounded-sm text-subhead text-accent-ink hover:underline">
            All components <ArrowRight className="size-4" />
          </Link>
        </div>
        <FeaturedEffects />
      </section>

      <section
        aria-labelledby="home-install"
        className="grid grid-cols-[minmax(0,1fr)] gap-3"
      >
        <h2 id="home-install" className="text-title3">
          Install
        </h2>
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
      </section>
    </div>
  );
}
