import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Tokens" };

const COLORS: { group: string; tokens: string[] }[] = [
  { group: "Surfaces", tokens: ["bg", "surface", "surface-2", "elevated", "fill", "fill-2", "fill-3"] },
  { group: "Content", tokens: ["fg", "fg-muted", "fg-subtle", "separator", "border"] },
  { group: "Accent", tokens: ["accent", "accent-hover", "accent-active", "accent-soft", "accent-ink", "on-accent", "ring"] },
  {
    group: "Status",
    tokens: ["success", "success-ink", "success-soft", "warning", "warning-ink", "warning-soft", "danger", "danger-ink", "danger-soft", "info", "info-ink", "info-soft"],
  },
];
const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Full class names, so Tailwind finds them.
const TYPE = [
  ["text-display-xl", "Display XL"], ["text-display", "Display"], ["text-display-sm", "Display S"],
  ["text-large-title", "Large Title"], ["text-title1", "Title 1"], ["text-title2", "Title 2"], ["text-title3", "Title 3"],
  ["text-headline", "Headline"], ["text-body", "Body"], ["text-callout", "Callout"], ["text-subhead", "Subhead"],
  ["text-footnote", "Footnote"], ["text-caption1", "Caption 1"], ["text-caption2", "Caption 2"],
] as const;
const RADII = [
  ["xs", "rounded-xs"], ["sm", "rounded-sm"], ["md", "rounded-md"], ["lg", "rounded-lg"],
  ["xl", "rounded-xl"], ["2xl", "rounded-2xl"], ["3xl", "rounded-3xl"], ["4xl", "rounded-4xl"],
] as const;
const SHADOWS = ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl"];
const MOTION = [
  ["--pl-duration-fast", "160ms", "Presses, hovers, small state changes"],
  ["--pl-duration-base", "240ms", "Popovers, toggles, most transitions"],
  ["--pl-duration-slow", "400ms", "Sheets and page-level movement"],
  ["--pl-ease-ios", "cubic-bezier(.32,.72,0,1)", "The iOS curve: quick start, long settle"],
  ["--pl-ease-spring", "cubic-bezier(.34,1.4,.64,1)", "A CSS spring with a small overshoot"],
  ["spring.snap / sheet / soft / bouncy", "Motion springs", "pleate/motion — for JS animations"],
];

export default function TokensPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Getting started" title="Design tokens">
        Every color, radius, shadow and timing is a CSS variable prefixed <code className="font-mono text-body">--pl-</code>, mapped to
        Tailwind utilities like <code className="font-mono text-body">bg-surface</code> or <code className="font-mono text-body">text-accent-ink</code>.
        Switch palette and theme from the header: everything below follows.
      </PageHeader>

      <div className="grid gap-12">
        {COLORS.map(({ group, tokens }) => (
          <section key={group}>
            <h2 className="mb-4 text-title2">{group}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {tokens.map((t) => (
                <div key={t} className="overflow-hidden rounded-2xl bg-surface shadow-xs">
                  <div className="h-16 shadow-[inset_0_-1px_0_var(--pl-separator)]" style={{ background: `var(--pl-${t})` }} />
                  <p className="truncate px-3 py-2 font-mono text-caption1">{t}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-1 text-title2">Accent scale</h2>
          <p className="mb-4 text-subhead text-fg-muted">Generated from the palette seed in OKLCH: bg-accent-50 … bg-accent-950.</p>
          <div className="flex overflow-hidden rounded-2xl shadow-xs">
            {SCALE.map((s) => (
              <div key={s} className="flex h-20 flex-1 items-end p-1.5" style={{ background: `var(--pl-accent-${s})` }}>
                <span className={`font-mono text-caption2 ${s >= 500 ? "text-accent-50" : "text-accent-950"}`}>{s}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-title2">Typography</h2>
          <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface px-5 shadow-xs">
            {TYPE.map(([cls, label]) => (
              <div key={cls} className="flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:gap-6">
                <span className="w-36 shrink-0 font-mono text-caption1 text-fg-muted">{cls}</span>
                <span className={`${cls} truncate`}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-title2">Radius</h2>
          <p className="mb-4 text-subhead text-fg-muted">All radii scale with one variable, --pl-roundness (try it on the Theming page).</p>
          <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
            {RADII.map(([r, cls]) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div className={`aspect-square w-full bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--pl-accent-ink)] ${cls}`} />
                <span className="font-mono text-caption1 text-fg-muted">{r}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-title2">Elevation</h2>
          <div className="grid grid-cols-2 gap-6 rounded-3xl bg-bg p-6 shadow-[inset_0_0_0_1px_var(--pl-separator)] md:grid-cols-5">
            {SHADOWS.map((s) => (
              <div key={s} className={`grid h-24 place-items-center rounded-2xl bg-surface font-mono text-caption1 ${s}`}>
                {s}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-title2">Motion</h2>
          <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface shadow-xs">
            {MOTION.map(([name, value, use]) => (
              <div key={name} className="grid gap-1 px-5 py-3 md:grid-cols-[18rem_14rem_1fr] md:gap-4">
                <span className="font-mono text-footnote text-accent-ink">{name}</span>
                <span className="font-mono text-footnote text-fg-muted">{value}</span>
                <span className="text-subhead">{use}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
