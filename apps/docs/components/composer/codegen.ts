// TSX code generator: turns a composer page into a Next.js page file that imports from the pleate subpaths. Pure TS
// (no React), mirrors sections.tsx one section at a time, so keep the two in step when a section changes.

import { slugify, type Block, type Page, type Project, type Props, type SiteTheme } from "./model.ts";

export const ICON_COMPONENTS: Record<string, string> = {
  sparkles: "Sparkles",
  zap: "Zap",
  shield: "Shield",
  globe: "Globe",
  lock: "Lock",
  heart: "Heart",
  chart: "ChartColumn",
  layers: "Layers",
  clock: "Clock",
  users: "Users",
};

type Imports = Map<string, Set<string>>;
type Raw = { raw: string };
type AttrValue = string | number | boolean | Raw | null | undefined;

const lit = (v: unknown) => JSON.stringify(v ?? "");
const SAFE_TEXT = /^[^{}<>"'&`\\\n]*$/;

/** A JSX text child: plain when it is safe to inline, otherwise a string expression. */
export function text(v: string) {
  return SAFE_TEXT.test(v) && v.trim() === v ? v : `{${lit(v)}}`;
}

/** One JSX attribute, or null to leave it out (empty strings and false are omitted). */
export function attr(name: string, v: AttrValue): string | null {
  if (v === undefined || v === null || v === "" || v === false) return null;
  if (v === true) return name;
  if (typeof v === "number") return `${name}={${v}}`;
  if (typeof v === "object") return `${name}={${v.raw}}`;
  return /^[^"\\\n{}]*$/.test(v) ? `${name}="${v}"` : `${name}={${lit(v)}}`;
}

const indent = (s: string, n = 2) =>
  s
    .split("\n")
    .map((l) => (l ? " ".repeat(n) + l : l))
    .join("\n");

/** An element: attributes inline when short, one per line otherwise; children indented. */
export function el(tag: string, attrs: (string | null)[], children?: string[]): string {
  const a = attrs.filter((x): x is string => x !== null);
  const inline = a.join(" ");
  const multi = inline.length > 80 || a.some((x) => x.includes("\n"));
  const open = multi ? `<${tag}\n${a.map((x) => indent(x)).join("\n")}\n` : `<${tag}${a.length ? " " + inline : ""}`;
  if (!children || children.length === 0) return `${open}${multi ? "" : " "}/>`;
  const oneLine = !multi && children.length === 1 && !children[0].includes("\n") && (open + children[0]).length < 90;
  if (oneLine) return `${open}>${children[0]}</${tag}>`;
  return `${open}>\n${children.map((c) => indent(c)).join("\n")}\n</${tag}>`;
}

const raw = (s: string): Raw => ({ raw: s });
const lines = (s: unknown) =>
  String(s ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const tone = (t: unknown) => (t === "default" ? undefined : (t as string));

// Static class lists so Tailwind sees them in the source (canvas uses the same strings).
export const STAT_COLS = ["sm:grid-cols-1", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"];
export const statCols = (n: number) => STAT_COLS[Math.min(4, Math.max(1, n))];
export const STATEMENT_CLASS = "max-w-4xl text-title1 leading-tight font-semibold md:text-[2.75rem] md:leading-[1.15]";

function sectionCode(block: Block, use: (mod: string, name: string) => void): string {
  const p: Props = block.props;
  const section = (attrs: (string | null)[], children: string[]) => {
    use("pleate/section", "Section");
    return el("Section", attrs, children);
  };
  const button = (label: string, extra: (string | null)[] = []) => {
    use("pleate/button", "Button");
    return el("Button", [attr("size", "lg"), ...extra], [text(label)]);
  };

  switch (block.type) {
    case "navbar": {
      use("pleate/navbar", "Navbar");
      use("pleate/navbar", "NavbarLink");
      if (p.showCta && p.cta) use("pleate/button", "Button");
      return el(
        "Navbar",
        [
          attr("brand", raw(`<span className="text-headline font-semibold">${text(p.brand)}</span>`)),
          p.showCta && p.cta ? attr("actions", raw(`<Button size="sm">${text(p.cta)}</Button>`)) : null,
        ],
        p.links.map((l: Props) => el("NavbarLink", [attr("href", "#")], [text(l.label)])),
      );
    }
    case "hero": {
      use("pleate/marketing/hero", "Hero");
      const actions = [p.primary && button(p.primary), p.secondary && button(p.secondary, [attr("variant", "tinted")])].filter(Boolean) as string[];
      return el("Hero", [
        attr("layout", p.layout),
        attr("background", p.background),
        attr("size", p.size),
        attr("eyebrow", p.eyebrow),
        attr("title", p.title),
        attr("description", p.description),
        actions.length ? attr("actions", raw(actions.length === 1 ? actions[0] : `<>\n${indent(actions.join("\n"))}\n</>`)) : null,
        attr("footnote", p.footnote),
        p.image ? attr("media", raw(`<img src=${lit(p.image)} alt="" className="w-full rounded-xl object-cover" />`)) : null,
      ]);
    }
    case "logos": {
      use("pleate/container", "Container");
      use("pleate/marketing/logo-marquee", "LogoMarquee");
      return el("Container", [attr("className", "py-10")], [
        ...(p.caption ? [el("p", [attr("className", "mb-6 text-center text-footnote font-semibold text-fg-muted")], [text(p.caption)])] : []),
        el(
          "LogoMarquee",
          [attr("label", "Logos"), attr("duration", p.duration), attr("reverse", p.reverse)],
          p.items.map((l: Props) => el("span", [attr("className", "text-title3 font-semibold whitespace-nowrap text-fg-subtle")], [text(l.name)])),
        ),
      ]);
    }
    case "features": {
      use("pleate/marketing/feature-grid", "FeatureGrid");
      const rows = p.items.map((f: Props, i: number) => {
        const icon = ICON_COMPONENTS[f.icon] ?? "Sparkles";
        use("lucide-react", icon);
        const span = p.variant === "bento" && i === 0 ? ", span: 2, rowSpan: 2" : "";
        return `{ icon: <${icon} />, title: ${lit(f.title)}, description: ${lit(f.description)}${span} },`;
      });
      return section(
        [attr("eyebrow", p.eyebrow), attr("title", p.title), attr("description", p.description), attr("align", p.align), attr("tone", tone(p.tone))],
        [el("FeatureGrid", [attr("variant", p.variant), attr("columns", Number(p.columns)), attr("features", raw(`[\n${indent(rows.join("\n"))}\n]`))])],
      );
    }
    case "stats": {
      use("pleate/effects/animated-text", "CountUp");
      return section([attr("title", p.title), attr("align", "center"), attr("tone", tone(p.tone)), attr("spacing", "md")], [
        el(
          "div",
          [attr("className", `grid grid-cols-1 gap-10 text-center ${statCols(p.items.length)}`)],
          p.items.map((s: Props) =>
            el("div", [], [
              el("p", [attr("className", "text-display")], [`${s.prefix ? text(s.prefix) : ""}<CountUp to={${Number(s.value) || 0}} />${s.suffix ? text(s.suffix) : ""}`]),
              el("p", [attr("className", "mt-1 text-subhead text-fg-muted")], [text(s.label)]),
            ]),
          ),
        ),
      ]);
    }
    case "pricing": {
      use("pleate/marketing/pricing", "Pricing");
      use("pleate/button", "Button");
      const plans = p.items.map((plan: Props, i: number) => {
        const cta = `<Button size="lg"${plan.highlighted ? "" : ' variant="gray"'}>${text(plan.cta)}</Button>`;
        return [
          "{",
          `  id: ${lit(`plan-${i + 1}`)},`,
          `  name: ${lit(plan.name)},`,
          plan.description ? `  description: ${lit(plan.description)},` : "",
          `  price: { monthly: ${Number(plan.monthly) || 0}, yearly: ${Number(plan.yearly) || 0} },`,
          `  features: [${lines(plan.features).map(lit).join(", ")}],`,
          plan.highlighted ? "  highlighted: true," : "",
          `  cta: ${cta},`,
          "},",
        ]
          .filter(Boolean)
          .join("\n");
      });
      return section(
        [attr("eyebrow", p.eyebrow), attr("title", p.title), attr("description", p.description), attr("align", "center"), attr("tone", tone(p.tone))],
        [el("Pricing", [attr("currency", p.currency), p.showToggle ? null : attr("showToggle", raw("false")), attr("plans", raw(`[\n${indent(plans.join("\n"))}\n]`))])],
      );
    }
    case "testimonials": {
      use("pleate/marketing/testimonial", "Testimonials");
      const items = p.items.map((t: Props) => `{ quote: ${lit(t.quote)}, name: ${lit(t.name)}, role: ${lit(t.role)}, rating: ${Number(t.rating) || 0} },`);
      return section([attr("eyebrow", p.eyebrow), attr("title", p.title), attr("align", "center")], [
        el("Testimonials", [attr("layout", p.layout), attr("items", raw(`[\n${indent(items.join("\n"))}\n]`))]),
      ]);
    }
    case "cta": {
      use("pleate/container", "Container");
      use("pleate/marketing/cta", "CTA");
      const btn = p.button ? button(p.button, [attr("variant", p.tone === "accent" ? "surface" : undefined)]) : null;
      return el("Container", [attr("className", "py-16")], [
        el("CTA", [attr("title", p.title), attr("description", p.description), attr("tone", p.tone), attr("align", p.align), btn ? attr("actions", raw(btn)) : null]),
      ]);
    }
    case "contact": {
      use("pleate/marketing/contact", "ContactForm");
      return section([attr("eyebrow", p.eyebrow), attr("title", p.title), attr("description", p.description), attr("align", p.align), attr("size", "sm")], [
        el("ContactForm", [attr("showSubject", p.showSubject), attr("footnote", p.footnote), attr("onSubmit", raw("async (values) => {\n  // Send values to your API here.\n}"))]),
      ]);
    }
    case "faq": {
      for (const n of ["Accordion", "AccordionContent", "AccordionItem", "AccordionTrigger"]) use("pleate/accordion", n);
      return section([attr("eyebrow", p.eyebrow), attr("title", p.title), attr("align", p.align), attr("size", "md")], [
        el(
          "Accordion",
          [attr("type", "single"), attr("collapsible", true), attr("variant", p.variant)],
          p.items.map((item: Props, i: number) =>
            el("AccordionItem", [attr("value", `q${i + 1}`)], [el("AccordionTrigger", [], [text(item.q)]), el("AccordionContent", [], [text(item.a)])]),
          ),
        ),
      ]);
    }
    case "footer": {
      for (const n of ["Footer", "FooterBottom", "FooterColumn", "FooterColumns", "FooterLink"]) use("pleate/footer", n);
      const brand = `<>\n  <span className="text-headline font-semibold">${text(p.brand)}</span>${p.tagline ? `\n  <p>${text(p.tagline)}</p>` : ""}\n</>`;
      return el("Footer", [attr("brand", raw(brand))], [
        el(
          "FooterColumns",
          [],
          p.columns.map((c: Props) => el("FooterColumn", [attr("title", c.title)], lines(c.links).map((l) => el("FooterLink", [attr("href", "#")], [text(l)])))),
        ),
        ...(p.copyright ? [el("FooterBottom", [], [el("span", [], [text(p.copyright)])])] : []),
      ]);
    }
    case "rotating": {
      use("pleate/effects/animated-text", "RotatingText");
      const words = lines(p.words);
      const head = [p.before && text(p.before), `<RotatingText words={[${words.map(lit).join(", ")}]} pillClassName="text-accent-ink" />`, p.after && text(p.after)].filter(Boolean).join(" ");
      return section([attr("tone", tone(p.tone)), attr("spacing", "lg")], [
        el("div", [attr("className", "mx-auto flex max-w-3xl flex-col items-center gap-6 text-center")], [
          el("h2", [attr("className", "text-display text-balance")], [head]),
          ...(p.description ? [el("p", [attr("className", "text-title3 font-normal text-fg-muted")], [text(p.description)])] : []),
          ...(p.button ? [button(p.button)] : []),
        ]),
      ]);
    }
    case "statement": {
      const cls = `${STATEMENT_CLASS} ${p.align === "center" ? "mx-auto text-center" : ""}`.trim();
      const name = p.effect === "gradient" ? "GradientText" : p.effect === "shiny" ? "ShinyText" : "BlurText";
      use("pleate/effects/animated-text", name);
      const body = name === "BlurText" ? el(name, [attr("as", "p"), attr("text", p.text), attr("className", cls)]) : el(name, [attr("as", "p"), attr("className", cls)], [text(p.text)]);
      return section([attr("tone", tone(p.tone)), attr("spacing", "lg")], [body]);
    }
    case "globe": {
      use("pleate/effects/depth", "DotGlobe");
      return section([attr("tone", tone(p.tone))], [
        el("div", [attr("className", "grid items-center gap-12 lg:grid-cols-2")], [
          el(
            "div",
            [],
            [
              p.eyebrow && el("p", [attr("className", "text-subhead font-semibold text-accent-ink")], [text(p.eyebrow)]),
              el("h2", [attr("className", "mt-3 text-display-sm text-balance")], [text(p.title)]),
              p.description && el("p", [attr("className", "mt-4 text-title3 font-normal text-fg-muted")], [text(p.description)]),
              p.button && button(p.button, [attr("className", "mt-8")]),
            ].filter(Boolean) as string[],
          ),
          el("div", [attr("className", "grid place-items-center")], [el("DotGlobe", [attr("size", 360), attr("speed", Number(p.speed))])]),
        ]),
      ]);
    }
  }
}

export const componentName = (name: string) => {
  const pascal = name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return `${/^[A-Z]/.test(pascal) ? pascal : `Page${pascal}`}Page`;
};

function rootAttrs(theme: SiteTheme, use: (mod: string, name: string) => void): (string | null)[] {
  const custom = theme.palette === "custom";
  const style: string[] = [];
  if (custom) {
    use("pleate/theme", "createPalette");
    use("pleate/theme", "paletteStyle");
    style.push(`...paletteStyle(createPalette(${lit(theme.custom)}), ${lit(theme.mode)})`);
  }
  if (theme.roundness !== 1.5) style.push(`"--pl-roundness": ${theme.roundness}`);
  if (style.length) use("react", "type CSSProperties");
  return [
    attr("data-theme", theme.mode),
    custom ? null : attr("data-palette", theme.palette),
    style.length ? attr("style", raw(`{ ${style.join(", ")} } as CSSProperties`)) : null,
    attr("className", "min-h-dvh bg-bg text-fg"),
  ];
}

/** The whole page file. */
export function generatePage(page: Page, theme: SiteTheme): string {
  const imports: Imports = new Map();
  const use = (mod: string, name: string) => {
    if (!imports.has(mod)) imports.set(mod, new Set());
    imports.get(mod)!.add(name);
  };
  const body = page.blocks.map((b) => sectionCode(b, use));
  const root = el("main", rootAttrs(theme, use), body.length ? body : ["{/* Add sections in the composer */}"]);
  const importLines = [...imports.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mod, names]) => `import { ${[...names].sort((a, b) => a.replace("type ", "").localeCompare(b.replace("type ", ""))).join(", ")} } from "${mod}";`);
  return [
    `"use client";`,
    "",
    ...importLines,
    "",
    `export default function ${componentName(page.name)}() {`,
    "  return (",
    indent(root, 4),
    "  );",
    "}",
    "",
  ].join("\n");
}

/** Every page as { "app/.../page.tsx": source }. */
export function generateProject(project: Project): Record<string, string> {
  const used = new Set<string>();
  return Object.fromEntries(
    project.pages.map((page, i) => {
      let path = i === 0 ? "app/page.tsx" : `app/${slugify(page.name)}/page.tsx`;
      for (let n = 2; used.has(path); n++) path = `app/${slugify(page.name)}-${n}/page.tsx`;
      used.add(path);
      return [path, generatePage(page, project.theme)];
    }),
  );
}

