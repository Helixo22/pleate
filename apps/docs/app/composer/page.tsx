import type { Metadata } from "next";
import { Composer } from "@/components/composer/composer";
import type { CatalogItem } from "@/components/composer/model";
import { DOCS } from "@/demos";
import { NAV } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Composer",
  description: "Build pages from pleate sections and components, theme them and export the TSX.",
};

// Every docs component, in nav order and grouped by nav section; anything not in the nav goes under "More".
function catalog(): CatalogItem[] {
  const seen = new Set<string>();
  const entries: [string, string][] = NAV.flatMap((s) =>
    s.items.filter((i) => i.ready && i.href.startsWith("/components/")).map((i) => [i.href.slice("/components/".length), s.title] as [string, string]),
  );
  for (const slug of Object.keys(DOCS)) entries.push([slug, "More"]);
  return entries.flatMap(([slug, section]) => {
    const doc = DOCS[slug];
    if (!doc || seen.has(slug)) return [];
    seen.add(slug);
    const name = doc.importName.split(/[^A-Za-z0-9]/)[0];
    return [
      {
        slug,
        name: doc.name,
        section,
        description: doc.description,
        demos: doc.demos.map((d) => ({ id: d.id, title: d.title })),
        background: section === "Backgrounds" && doc.importPath ? { name, path: doc.importPath } : undefined,
      },
    ];
  });
}

export default function ComposerPage() {
  return <Composer catalog={catalog()} />;
}
