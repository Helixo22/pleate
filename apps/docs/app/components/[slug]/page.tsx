// A component page: header, import line, every example with its source (read from demos/<slug>/<id>.tsx at build
// time, so the code shown is the code running), props table and accessibility notes.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoFrame } from "@/components/demo-frame";
import { CodeLine, PageHeader } from "@/components/page-header";
import { DOCS } from "@/demos";
import { NAV } from "@/lib/nav";

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
  const section = NAV.find((s) => s.items.some((i) => i.href === `/components/${slug}`))?.title;

  return (
    <article className="mx-auto max-w-4xl">
      <PageHeader eyebrow={section} title={doc.name}>
        {doc.description}
      </PageHeader>
      <div className="mb-12">
        <CodeLine>{`import { ${doc.importName} } from "${doc.importPath ?? `pleate/${slug}`}";`}</CodeLine>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-14">
        {doc.demos.map(({ id, title, description, align, Component }) => (
          <DemoFrame key={id} id={id} title={title} description={description} align={align} code={source(slug, id)}>
            <Component />
          </DemoFrame>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="mb-4 text-title2">Props</h2>
        <div className="overflow-x-auto rounded-2xl bg-surface shadow-xs">
          <table className="w-full min-w-[36rem] text-start text-subhead">
            <thead>
              <tr className="border-b border-separator text-footnote text-fg-muted">
                <th className="px-5 py-3 text-start font-semibold">Prop</th>
                <th className="px-5 py-3 text-start font-semibold">Type</th>
                <th className="px-5 py-3 text-start font-semibold">Default</th>
                <th className="px-5 py-3 text-start font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {doc.props.map((p) => (
                <tr key={p.name} className="border-b border-separator last:border-0 align-top">
                  <td className="px-5 py-3 font-mono text-footnote font-semibold whitespace-nowrap text-accent-ink">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-footnote text-fg-muted">{p.type}</td>
                  <td className="px-5 py-3 font-mono text-footnote text-fg-muted">{p.default ?? ""}</td>
                  <td className="px-5 py-3">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {doc.a11y && (
        <section className="mt-12">
          <h2 className="mb-4 text-title2">Accessibility</h2>
          <ul className="grid gap-2 text-body text-fg-muted">
            {doc.a11y.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
