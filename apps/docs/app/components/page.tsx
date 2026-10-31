// Component index: every section of the nav with each ready component's one-line description, for scanning the
// whole library at once.
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DOCS } from "@/demos";
import { NAV } from "@/lib/nav";

export const metadata: Metadata = { title: "Components", description: "Every pleate component, by section." };

export default function ComponentsIndex() {
  const sections = NAV.filter((s) => s.items.some((i) => i.href.startsWith("/components/")));
  const total = sections.reduce((n, s) => n + s.items.filter((i) => i.ready && i.href.startsWith("/components/")).length, 0);
  return (
    <article className="mx-auto max-w-5xl">
      <PageHeader eyebrow={`${total} components`} title="Components">
        Every component by section. Each page has live examples, the code behind them, props and accessibility notes.
      </PageHeader>
      <div className="flex flex-col gap-12">
        {sections.map((section) => (
          <section key={section.title} className="grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8">
            <h2 className="text-headline md:pt-3">{section.title}</h2>
            <ul className="grid border-t border-separator sm:grid-cols-2 sm:gap-x-8">
              {section.items
                .filter((i) => i.ready && i.href.startsWith("/components/"))
                .map((item) => {
                  const doc = DOCS[item.href.replace("/components/", "")];
                  return (
                    <li key={item.href} className="border-b border-separator">
                      <Link href={item.href} className="pl-focus-ring group -mx-2 flex flex-col gap-0.5 rounded-sm px-2 py-3 transition-colors hover:bg-fill-3">
                        <span className="text-subhead font-medium text-fg group-hover:text-accent-ink">{item.name}</span>
                        {doc && <span className="line-clamp-2 text-footnote text-fg-muted">{doc.description}</span>}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
