// Live renderers for composer sections, built from the real pleate parts. Each case mirrors codegen.ts, so the
// exported TSX renders what the canvas shows.
"use client";

import { ChartColumn, Clock, Globe, Heart, ImageIcon, Layers, Lock, Shield, Sparkles, Users, Zap, type LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "pleate/accordion";
import { Button } from "pleate/button";
import { Container } from "pleate/container";
import { BlurText, CountUp, GradientText, RotatingText, ShinyText } from "pleate/effects/animated-text";
import { DotGlobe } from "pleate/effects/depth";
import { Footer, FooterBottom, FooterColumn, FooterColumns, FooterLink } from "pleate/footer";
import { ContactForm } from "pleate/marketing/contact";
import { CTA } from "pleate/marketing/cta";
import { FeatureGrid } from "pleate/marketing/feature-grid";
import { Hero } from "pleate/marketing/hero";
import { LogoMarquee } from "pleate/marketing/logo-marquee";
import { Pricing } from "pleate/marketing/pricing";
import { Testimonials } from "pleate/marketing/testimonial";
import { Navbar, NavbarLink } from "pleate/navbar";
import { Section } from "pleate/section";
import { STATEMENT_CLASS, statCols } from "./codegen";
import type { Block, Props } from "./model";

const ICONS: Record<string, LucideIcon> = { sparkles: Sparkles, zap: Zap, shield: Shield, globe: Globe, lock: Lock, heart: Heart, chart: ChartColumn, layers: Layers, clock: Clock, users: Users };

const lines = (s: unknown) =>
  String(s ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
type Tone = "surface" | "dark" | undefined;
const tone = (t: unknown) => (t === "default" ? undefined : (t as Tone));
const noop = async () => {};

/** `editing` adds hints that only make sense in the editor (an empty image slot). */
export function SectionView({ block, editing = false }: { block: Block; editing?: boolean }) {
  const p: Props = block.props;
  switch (block.type) {
    case "navbar":
      return (
        <Navbar
          sticky={false}
          brand={<span className="text-headline font-semibold">{p.brand}</span>}
          actions={p.showCta && p.cta ? <Button size="sm">{p.cta}</Button> : undefined}
        >
          {p.links.map((l: Props, i: number) => (
            <NavbarLink key={i} href="#">
              {l.label}
            </NavbarLink>
          ))}
        </Navbar>
      );
    case "hero": {
      const media = p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="w-full rounded-xl object-cover" />
      ) : editing && p.layout === "split" ? (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-border text-fg-subtle">
          <span className="flex items-center gap-2 text-footnote">
            <ImageIcon className="size-4" /> Add an image URL
          </span>
        </div>
      ) : undefined;
      return (
        <Hero
          layout={p.layout}
          background={p.background}
          size={p.size}
          eyebrow={p.eyebrow || undefined}
          title={p.title}
          description={p.description || undefined}
          actions={
            p.primary || p.secondary ? (
              <>
                {p.primary && <Button size="lg">{p.primary}</Button>}
                {p.secondary && (
                  <Button size="lg" variant="tinted">
                    {p.secondary}
                  </Button>
                )}
              </>
            ) : undefined
          }
          footnote={p.footnote || undefined}
          media={media}
        />
      );
    }
    case "logos":
      return (
        <Container className="py-10">
          {p.caption && <p className="mb-6 text-center text-footnote font-semibold text-fg-muted">{p.caption}</p>}
          <LogoMarquee label="Logos" duration={p.duration} reverse={p.reverse}>
            {p.items.map((l: Props, i: number) => (
              <span key={i} className="text-title3 font-semibold whitespace-nowrap text-fg-subtle">
                {l.name}
              </span>
            ))}
          </LogoMarquee>
        </Container>
      );
    case "features":
      return (
        <Section eyebrow={p.eyebrow || undefined} title={p.title || undefined} description={p.description || undefined} align={p.align} tone={tone(p.tone)}>
          <FeatureGrid
            variant={p.variant}
            columns={Number(p.columns) as 2 | 3 | 4}
            features={p.items.map((f: Props, i: number) => {
              const Icon = ICONS[f.icon] ?? Sparkles;
              const big = p.variant === "bento" && i === 0;
              return { icon: <Icon />, title: f.title, description: f.description, ...(big ? { span: 2 as const, rowSpan: 2 as const } : {}) };
            })}
          />
        </Section>
      );
    case "stats":
      return (
        <Section title={p.title || undefined} align="center" tone={tone(p.tone)} spacing="md">
          <div className={`grid grid-cols-1 gap-10 text-center ${statCols(p.items.length)}`}>
            {p.items.map((s: Props, i: number) => (
              <div key={i}>
                <p className="text-display">
                  {s.prefix}
                  <CountUp to={Number(s.value) || 0} />
                  {s.suffix}
                </p>
                <p className="mt-1 text-subhead text-fg-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    case "pricing":
      return (
        <Section eyebrow={p.eyebrow || undefined} title={p.title || undefined} description={p.description || undefined} align="center" tone={tone(p.tone)}>
          <Pricing
            currency={p.currency}
            showToggle={p.showToggle}
            plans={p.items.map((plan: Props, i: number) => ({
              id: `plan-${i + 1}`,
              name: plan.name,
              description: plan.description || undefined,
              price: { monthly: Number(plan.monthly) || 0, yearly: Number(plan.yearly) || 0 },
              features: lines(plan.features),
              highlighted: plan.highlighted,
              cta: (
                <Button size="lg" variant={plan.highlighted ? undefined : "gray"}>
                  {plan.cta}
                </Button>
              ),
            }))}
          />
        </Section>
      );
    case "testimonials":
      return (
        <Section eyebrow={p.eyebrow || undefined} title={p.title || undefined} align="center">
          <Testimonials layout={p.layout} items={p.items.map((t: Props) => ({ quote: t.quote, name: t.name, role: t.role, rating: Number(t.rating) || 0 }))} />
        </Section>
      );
    case "cta":
      return (
        <Container className="py-16">
          <CTA
            title={p.title}
            description={p.description || undefined}
            tone={p.tone}
            align={p.align}
            actions={
              p.button ? (
                <Button size="lg" variant={p.tone === "accent" ? "surface" : undefined}>
                  {p.button}
                </Button>
              ) : undefined
            }
          />
        </Container>
      );
    case "contact":
      return (
        <Section eyebrow={p.eyebrow || undefined} title={p.title || undefined} description={p.description || undefined} align={p.align} size="sm">
          <ContactForm showSubject={p.showSubject} footnote={p.footnote || undefined} onSubmit={noop} />
        </Section>
      );
    case "faq":
      return (
        <Section eyebrow={p.eyebrow || undefined} title={p.title || undefined} align={p.align} size="md">
          <Accordion type="single" collapsible variant={p.variant}>
            {p.items.map((item: Props, i: number) => (
              <AccordionItem key={i} value={`q${i + 1}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      );
    case "footer":
      return (
        <Footer
          brand={
            <>
              <span className="text-headline font-semibold">{p.brand}</span>
              {p.tagline && <p>{p.tagline}</p>}
            </>
          }
        >
          <FooterColumns>
            {p.columns.map((c: Props, i: number) => (
              <FooterColumn key={i} title={c.title}>
                {lines(c.links).map((l, j) => (
                  <FooterLink key={j} href="#">
                    {l}
                  </FooterLink>
                ))}
              </FooterColumn>
            ))}
          </FooterColumns>
          {p.copyright && (
            <FooterBottom>
              <span>{p.copyright}</span>
            </FooterBottom>
          )}
        </Footer>
      );
    case "rotating": {
      const words = lines(p.words);
      return (
        <Section tone={tone(p.tone)} spacing="lg">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <h2 className="text-display text-balance">
              {p.before && `${p.before} `}
              {words.length > 0 && <RotatingText key={words.join("|")} words={words} pillClassName="text-accent-ink" />}
              {p.after && ` ${p.after}`}
            </h2>
            {p.description && <p className="text-title3 font-normal text-fg-muted">{p.description}</p>}
            {p.button && <Button size="lg">{p.button}</Button>}
          </div>
        </Section>
      );
    }
    case "statement": {
      const cls = `${STATEMENT_CLASS} ${p.align === "center" ? "mx-auto text-center" : ""}`;
      return (
        <Section tone={tone(p.tone)} spacing="lg">
          {p.effect === "gradient" ? (
            <GradientText as="p" className={cls}>
              {p.text}
            </GradientText>
          ) : p.effect === "shiny" ? (
            <ShinyText as="p" className={cls}>
              {p.text}
            </ShinyText>
          ) : (
            <BlurText key={p.text} as="p" text={p.text} className={cls} />
          )}
        </Section>
      );
    }
    case "globe":
      return (
        <Section tone={tone(p.tone)}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              {p.eyebrow && <p className="text-subhead font-semibold text-accent-ink">{p.eyebrow}</p>}
              <h2 className="mt-3 text-display-sm text-balance">{p.title}</h2>
              {p.description && <p className="mt-4 text-title3 font-normal text-fg-muted">{p.description}</p>}
              {p.button && (
                <Button size="lg" className="mt-8">
                  {p.button}
                </Button>
              )}
            </div>
            <div className="grid place-items-center">
              <DotGlobe size={360} speed={Number(p.speed)} />
            </div>
          </div>
        </Section>
      );
  }
}
