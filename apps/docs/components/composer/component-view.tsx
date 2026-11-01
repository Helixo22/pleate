// A component block on the canvas: one docs demo, or a background effect behind a headline. Modules load lazily
// from loaders.ts, so the composer only downloads what is on the page; a failing demo shows a note, not a crash.
"use client";

import { Button } from "pleate/button";
import { Section } from "pleate/section";
import { Component, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { BG_CONTENT_CLASS, BG_LAYER_CLASS, BG_SECTION_CLASS, COMPONENT_BG, COMPONENT_WIDTH } from "./codegen";
import { BACKGROUND_LOADERS, DEMO_LOADERS } from "./loaders";
import type { Props } from "./model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, LazyExoticComponent<ComponentType<any>>>();
function load(key: string, loader: (() => Promise<{ default: ComponentType }>) | undefined) {
  if (!loader) return null;
  if (!cache.has(key)) cache.set(key, lazy(loader));
  return cache.get(key)!;
}

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <p className="p-6 text-center text-footnote text-fg-muted">This component could not render here.</p> : this.props.children;
  }
}

const Loading = () => <div aria-hidden className="h-40 w-full animate-pulse rounded-lg bg-fill-3" />;

export const canBackground = (slug: string) => slug in BACKGROUND_LOADERS;

export function ComponentView({ p }: { p: Props }) {
  const bgLoader = BACKGROUND_LOADERS[p.slug];
  if (p.asBackground && bgLoader) {
    const Bg = load(`bg:${p.slug}`, () => bgLoader().then((C) => ({ default: C })));
    return (
      <section className={BG_SECTION_CLASS} style={{ minHeight: Number(p.height) || 560 }}>
        <Boundary resetKey={p.slug}>
          <Suspense fallback={null}>{Bg && <Bg className={BG_LAYER_CLASS} />}</Suspense>
        </Boundary>
        <div className={BG_CONTENT_CLASS}>
          {p.eyebrow && <p className="text-subhead font-medium text-accent-ink">{p.eyebrow}</p>}
          {p.heading && <h2 className="text-display text-balance">{p.heading}</h2>}
          {p.description && <p className="text-title3 font-normal text-fg-muted">{p.description}</p>}
          {(p.primary || p.secondary) && (
            <div className="flex flex-wrap justify-center gap-3">
              {p.primary && <Button size="lg">{p.primary}</Button>}
              {p.secondary && (
                <Button size="lg" variant="tinted">
                  {p.secondary}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }
  const key = `${p.slug}/${p.demo}`;
  const Demo = load(key, DEMO_LOADERS[key]);
  return (
    <Section
      eyebrow={p.eyebrow || undefined}
      title={p.heading || undefined}
      description={p.description || undefined}
      align={p.align}
      size={COMPONENT_WIDTH[p.width as keyof typeof COMPONENT_WIDTH]}
      spacing={p.padding}
      className={COMPONENT_BG[p.background]}
    >
      <div className={p.align === "center" ? "grid justify-items-center" : "grid"}>
        <Boundary resetKey={key}>
          <Suspense fallback={<Loading />}>{Demo ? <Demo /> : <p className="text-footnote text-fg-muted">Unknown component.</p>}</Suspense>
        </Boundary>
      </div>
    </Section>
  );
}
