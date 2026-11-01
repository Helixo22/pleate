// Results and sources an assistant used. ResultCard: a rich card (image, title, site, snippet, tags, actions) for
// search results, places or products. SourceChip: the small numbered citation inside an answer, with the site
// name on hover/focus. SourceList: a horizontal row of compact source cards.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

// Links come from model citations: only http(s) may become an href.
const safeHref = (url?: string) => (url && /^https?:\/\//i.test(url) ? url : undefined);

const domain = (url?: string) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : undefined;
  } catch {
    return undefined;
  }
};

function SiteIcon({ src, label }: { src?: string; label?: string }) {
  return src ? (
    <img src={src} alt="" className="size-4 shrink-0 rounded-[0.25rem] bg-fill-2" />
  ) : (
    <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-[0.25rem] bg-fill text-[0.6875rem] font-medium text-fg-muted uppercase">
      {label?.[0] ?? "·"}
    </span>
  );
}

export type ResultCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode;
  href?: string;
  /** Site name; defaults to the link's domain. */
  site?: string;
  favicon?: string;
  snippet?: ReactNode;
  image?: string;
  imageAlt?: string;
  /** Small facts under the title (rating, price, date…). */
  meta?: ReactNode;
  tags?: ReactNode;
  actions?: ReactNode;
  /** Citation number, matching SourceChip. */
  index?: number;
  layout?: "vertical" | "horizontal";
};

export function ResultCard({ title, href, site, favicon, snippet, image, imageAlt = "", meta, tags, actions, index, layout = "vertical", className, ...props }: ResultCardProps) {
  const host = site ?? domain(href);
  const horizontal = layout === "horizontal";
  const Title = safeHref(href) ? "a" : "span";
  return (
    <article
      className={cn(
        "group relative flex overflow-hidden pl-field [--pl-field-border:var(--pl-separator)] rounded-xl bg-surface transition-[box-shadow] duration-(--pl-duration-base) hover:[--pl-field-border:var(--pl-border)]",
        horizontal ? "flex-row" : "flex-col",
        className,
      )}
      {...props}
    >
      {image && (
        <img
          src={image}
          alt={imageAlt}
          className={cn("shrink-0 bg-fill-2 object-cover", horizontal ? "w-28 self-stretch sm:w-36" : "aspect-[16/9] w-full")}
          loading="lazy"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        {(host || index !== undefined) && (
          <div className="flex items-center gap-1.5 text-caption1 text-fg-muted">
            <SiteIcon src={favicon} label={host} />
            <span className="truncate">{host}</span>
            {index !== undefined && <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-fill-2 px-1.5 font-medium pl-tabular">{index}</span>}
          </div>
        )}
        <Title
          {...(safeHref(href) && { href: safeHref(href), target: "_blank", rel: "noreferrer" })}
          className={cn(
            "line-clamp-2 text-headline text-fg",
            // The whole card is clickable through the title's link.
            href && "pl-focus-ring rounded-xs after:absolute after:inset-0 after:content-[''] group-hover:text-accent-ink",
          )}
        >
          {title}
        </Title>
        {meta && <div className="flex flex-wrap items-center gap-x-2 text-footnote text-fg-muted">{meta}</div>}
        {snippet && <p className="line-clamp-3 text-subhead text-fg-muted">{snippet}</p>}
        {tags && <div className="mt-1 flex flex-wrap gap-1.5">{tags}</div>}
        {actions && <div className="relative z-[1] mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}

export type SourceChipProps = { index: number; href?: string; site?: string; title?: string; className?: string };

export function SourceChip({ index, href, site, title, className }: SourceChipProps) {
  const host = site ?? domain(href);
  const Comp = safeHref(href) ? "a" : "span";
  return (
    <Comp
      {...(safeHref(href) && { href: safeHref(href), target: "_blank", rel: "noreferrer" })}
      title={[title, host].filter(Boolean).join(", ") || undefined}
      aria-label={`Source ${index}${host ? `: ${host}` : ""}`}
      className={cn(
        "pl-focus-ring mx-0.5 inline-flex h-[1.15rem] min-w-[1.15rem] -translate-y-px items-center justify-center rounded-full bg-fill-2 px-1 align-middle text-caption2 font-medium text-fg-muted no-underline",
        href && "transition-colors hover:bg-accent hover:text-on-accent",
        className,
      )}
    >
      {index}
    </Comp>
  );
}

export type SourceListProps = { sources: { href: string; title: string; site?: string; favicon?: string }[]; label?: string; className?: string };

export function SourceList({ sources, label = "Sources", className }: SourceListProps) {
  return (
    // contain-inline-size: a long row scrolls inside its column instead of widening the column.
    <ol aria-label={label} className={cn("pl-no-scrollbar flex gap-2 overflow-x-auto pb-1 [contain:inline-size]", className)}>
      {sources.map((s, i) => (
        <li key={s.href} className="w-44 shrink-0">
          <a
            href={safeHref(s.href)}
            target="_blank"
            rel="noreferrer"
            className="pl-focus-ring flex h-full flex-col gap-1.5 rounded-xl bg-fill-3 p-2.5 transition-colors hover:bg-fill-2"
          >
            <span className="line-clamp-2 text-footnote font-medium text-fg">{s.title}</span>
            <span className="mt-auto flex items-center gap-1.5 text-caption2 text-fg-muted">
              <SiteIcon src={s.favicon} label={s.site ?? domain(s.href)} />
              <span className="truncate">{s.site ?? domain(s.href)}</span>
              <span className="ms-auto pl-tabular">{i + 1}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
