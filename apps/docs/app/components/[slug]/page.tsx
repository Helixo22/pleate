// A component page: header, import line, every example in a large live frame with its source (read from
// demos/<slug>/<id>.tsx at build time, so the code shown is the code running), props, accessibility notes and the
// neighbours in the same section.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoFrame } from "@/components/demo-frame";
import { CodeLine, PageHeader } from "@/components/page-header";
import { DOCS } from "@/demos";
import { NAV } from "@/lib/nav";

// Sections whose demos play once or react to the pointer: their frames get a Replay button and more room.
const PLAYFUL = new Set(["Effects", "Text Animations", "Animations", "Interactive", "Backgrounds"]);

const sectionId = (title: string) => title.toLowerCase().replace(/\s+/g, "-");

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doc = DOCS[(await params).slug];
  return doc ? { title: doc.name, description: doc.description } : {};
}

function source(slug: string, id: string) {
  const file = path.join(process.cwd(), "demos", slug, `${id}.tsx`);
  return readFileSync(file, "utf8").replace(/^"use client";\n\n/, "").trim();
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();
  const href = `/components/${slug}`;
  const section = NAV.find((s) => s.items.some((i) => i.href === href));
  const replay = (section && PLAYFUL.has(section.title)) || doc.importPath?.startsWith("pleate/effects/");
  const siblings = section?.items.filter((i) => i.ready && i.href.startsWith("/components/")) ?? [];
  const at = siblings.findIndex((i) => i.href === href);
  const prev = at > 0 ? siblings[at - 1] : undefined;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : undefined;

  return (
    <article className="mx-auto max-w-5xl">
      <PageHeader eyebrow={section?.title} eyebrowHref={section && `/components#${sectionId(section.title)}`} title={doc.name}>
        {doc.description}
      </PageHeader>
      <div className="mb-12 max-w-2xl">
        <CodeLine>{`import { ${doc.importName} } from "${doc.importPath ?? `pleate/${slug}`}";`}</CodeLine>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12">
        {doc.demos.map(({ id, title, description, align, Component }) => (
          <DemoFrame key={id} id={id} title={title} description={description} align={align} replay={replay} code={source(slug, id)}>
            <Component />
          </DemoFrame>
        ))}
      </div>

      <section className="mt-16" aria-labelledby="props">
        <h2 id="props" className="mb-4 text-title2">
          Props
        </h2>
        <dl className="overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)]">
          {doc.props.map((p) => (
            <div key={p.name} className="grid gap-x-8 gap-y-1.5 border-b border-separator px-5 py-4 last:border-0 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
              <dt className="font-mono text-footnote break-words text-fg">{p.name}</dt>
              <dd className="min-w-0">
                <p className="text-subhead text-fg">{p.description}</p>
                <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-caption1 text-fg-muted">
                  <code className="break-words">{p.type}</code>
                  {p.default && (
                    <span>
                      <span className="text-fg-subtle">default </span>
                      {p.default}
                    </span>
                  )}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {doc.a11y && (
        <section className="mt-12">
          <h2 className="mb-4 text-title2">Accessibility</h2>
          <ul className="grid max-w-2xl gap-2.5 text-body text-fg-muted">
            {doc.a11y.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-[0.6875rem] h-px w-3 shrink-0 bg-fg-subtle" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav aria-label="More in this section" className="mt-16 grid gap-3 sm:grid-cols-2">
          {[prev, next].map((item, i) =>
            item ? (
              <Link
                key={item.href}
                href={item.href}
                className={`pl-focus-ring group flex flex-col gap-1 rounded-2xl bg-surface px-5 py-4 shadow-[inset_0_0_0_1px_var(--pl-separator)] transition-colors hover:bg-fill-3 ${i ? "sm:col-start-2 sm:items-end" : ""}`}
              >
                <span className="flex items-center gap-1.5 text-caption1 text-fg-subtle">
                  {i ? <>Next <ArrowRight className="size-3.5" /></> : <><ArrowLeft className="size-3.5" /> Previous</>}
                </span>
                <span className="text-headline text-fg">{item.name}</span>
              </Link>
            ) : null,
          )}
        </nav>
      )}
    </article>
  );
}
