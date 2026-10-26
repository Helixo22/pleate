// A Backend guide: header, the page content (content/backend/<slug>.tsx) and links to the previous and next guide.
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BACKEND_CONTENT } from "@/content/backend";
import { BACKEND_PAGES } from "@/lib/backend-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return BACKEND_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = BACKEND_PAGES.find((p) => p.slug === slug);
  return page ? { title: page.title, description: page.description } : {};
}

export default async function BackendGuide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = BACKEND_PAGES.findIndex((p) => p.slug === slug);
  const page = BACKEND_PAGES[index];
  const Content = BACKEND_CONTENT[slug];
  if (!page || !Content) notFound();
  const prev = BACKEND_PAGES[index - 1];
  const next = BACKEND_PAGES[index + 1];

  return (
    <article className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Backend" title={page.title}>
        {page.description}
      </PageHeader>
      <Content />
      <nav aria-label="Backend guides" className="mt-20 grid gap-3 border-t border-separator pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/backend/${prev.slug}`}
            className="pl-focus-ring flex flex-col gap-1 rounded-2xl bg-surface px-5 py-4 shadow-xs transition-colors hover:bg-fill-hover"
          >
            <span className="flex items-center gap-1.5 text-footnote text-fg-muted">
              <ArrowLeft className="size-3.5" aria-hidden /> Previous
            </span>
            <span className="text-headline">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/backend/${next.slug}`}
            className="pl-focus-ring flex flex-col items-end gap-1 rounded-2xl bg-surface px-5 py-4 text-end shadow-xs transition-colors hover:bg-fill-hover"
          >
            <span className="flex items-center gap-1.5 text-footnote text-fg-muted">
              Next <ArrowRight className="size-3.5" aria-hidden />
            </span>
            <span className="text-headline">{next.name}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
