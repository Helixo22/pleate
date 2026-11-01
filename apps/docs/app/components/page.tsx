// Component index: every section of the nav as a grid of cards, filterable by text.
import type { Metadata } from "next";
import { ComponentIndex, type IndexSection } from "@/components/component-index";
import { PageHeader } from "@/components/page-header";
import { DOCS } from "@/demos";
import { NAV } from "@/lib/nav";

export const metadata: Metadata = { title: "Components", description: "Every pleate component, by section." };

export default function ComponentsIndex() {
  // Only plain data crosses into the client grid (DOCS entries hold components).
  const sections: IndexSection[] = NAV.map((s) => ({
    id: s.title.toLowerCase().replace(/\s+/g, "-"),
    title: s.title,
    items: s.items
      .filter((i) => i.ready && i.href.startsWith("/components/"))
      .map((i) => ({ name: i.name, href: i.href, description: DOCS[i.href.replace("/components/", "")]?.description })),
  })).filter((s) => s.items.length);
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  return (
    <article className="mx-auto max-w-6xl">
      <PageHeader eyebrow={`${total} components`} title="Components">
        Every component by section. Each page has live examples, the code behind them, props and accessibility notes.
      </PageHeader>
      <ComponentIndex sections={sections} />
    </article>
  );
}
