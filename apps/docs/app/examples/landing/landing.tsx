// A full landing page for a fictional travel app (Plate), built only from pleate components: navbar, hero, partners, bento
// features, numbers, a scroll-lit statement, testimonials, pricing, FAQ, CTA and footer.
"use client";

import { ArrowRight, BellRing, CalendarDays, Compass, Heart, House, Map, MessageCircle, Plane, ShieldCheck, User, Wallet } from "lucide-react";
import Link from "next/link";
import { BotFace } from "pleate/ai/bot-face";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "pleate/accordion";
import { Avatar, AvatarGroup } from "pleate/avatar";
import { Button } from "pleate/button";
import { Container } from "pleate/container";
import { CountUp, RotatingText, ScrollRevealText } from "pleate/effects/animated-text";
import { Reveal } from "pleate/effects/reveal";
import { Footer, FooterBottom, FooterColumn, FooterColumns, FooterLink } from "pleate/footer";
import { List, ListItem, ListSection } from "pleate/list";
import { CTA } from "pleate/marketing/cta";
import { FeatureGrid } from "pleate/marketing/feature-grid";
import { Hero } from "pleate/marketing/hero";
import { LogoMarquee } from "pleate/marketing/logo-marquee";
import { Pricing } from "pleate/marketing/pricing";
import { Testimonials } from "pleate/marketing/testimonial";
import { Navbar, NavbarLink } from "pleate/navbar";
import { Section } from "pleate/section";
import { Switch } from "pleate/switch";
import { TabBar, TabBarItem } from "pleate/tab-bar";
import { ThemeSwitch } from "@/components/theme-controls";

function Brand() {
  return (
    <Link href="/examples/landing" className="pl-focus-ring flex items-center gap-2 rounded-md text-headline font-bold">
      <span aria-hidden className="grid size-7 place-items-center rounded-[30%] bg-accent text-on-accent">
        <Compass className="size-4" />
      </span>
      Plate
    </Link>
  );
}

function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[19rem] rounded-[3rem] bg-fg p-2.5 shadow-xl">
      <div data-theme="light" className="flex h-[36rem] flex-col overflow-hidden rounded-[2.4rem] bg-bg">
        <div className="px-5 pt-10 pb-3">
          <p className="text-footnote font-semibold text-fg-muted">Fri 12 June</p>
          <p className="text-large-title">Lisbon</p>
        </div>
        <div className="flex-1 overflow-hidden px-3">
          <List className="gap-5">
            <ListSection header="Today">
              <ListItem icon={<Plane />} iconColor="var(--pl-info)" title="TP 1234 · MXP → LIS" subtitle="Gate B12 · on time" value="09:40" />
              <ListItem icon={<House />} iconColor="var(--pl-success)" title="Alfama rooftop flat" subtitle="Check-in from 14:00" />
              <ListItem icon={<MessageCircle />} iconColor="var(--pl-accent)" title="Dinner vote" subtitle="3 of 4 voted" trailing={<AvatarGroup size="xs" max={3}><Avatar name="Sofia R" /><Avatar name="Omar H" /><Avatar name="Chiara B" /></AvatarGroup>} />
            </ListSection>
            <ListSection header="Trip">
              <ListItem icon={<BellRing />} iconColor="var(--pl-danger)" title="Price alerts" trailing={<Switch size="sm" aria-label="Price alerts" defaultChecked tone="success" />} />
              <ListItem icon={<Wallet />} iconColor="var(--pl-warning)" title="Budget" value="€384 left" />
            </ListSection>
          </List>
        </div>
        <TabBar position="static" defaultValue="home" label="App tabs">
          <TabBarItem value="home" icon={<House />} label="Today" />
          <TabBarItem value="map" icon={<Map />} label="Map" />
          <TabBarItem value="saved" icon={<Heart />} label="Saved" />
          <TabBarItem value="me" icon={<User />} label="Profile" />
        </TabBar>
      </div>
    </div>
  );
}

const PARTNERS = ["Alfama Stays", "Kyoto Rail", "NaplesEats", "Oaxaca Tours", "Fjord Air", "Atlas Hotels", "Medina Trails", "Porto Ferries"];

export function Landing() {
  return (
    <div className="min-h-dvh bg-bg">
      <Navbar
        hideOnScroll
        brand={<Brand />}
        actions={
          <>
            <span className="hidden sm:block">
              <ThemeSwitch />
            </span>
            <Button size="sm" className="max-sm:hidden">Get started</Button>
          </>
        }
        panelFooter={<Button size="lg" fullWidth>Get started</Button>}
      >
        <NavbarLink href="#features">Features</NavbarLink>
        <NavbarLink href="#assistant">Assistant</NavbarLink>
        <NavbarLink href="#pricing">Pricing</NavbarLink>
        <NavbarLink href="#faq">FAQ</NavbarLink>
        <NavbarLink asChild>
          <Link href="/">Docs</Link>
        </NavbarLink>
      </Navbar>

      <Hero
        layout="split"
        background="wash"
        eyebrow={<a href="#assistant">New · Plan with an assistant <ArrowRight className="inline size-3.5" /></a>}
        title={
          <>
            Weekend in <RotatingText words={["Lisbon", "Kyoto", "Naples", "Oaxaca"]} pillClassName="text-accent-ink" />
            <br />
            planned together.
          </>
        }
        description="One shared plan for flights, stays, money and every “where do we eat?” — beautiful on every phone."
        actions={
          <>
            <Button size="lg" endIcon={<ArrowRight />}>Start planning</Button>
            <Button size="lg" variant="tinted">See how it works</Button>
          </>
        }
        footnote="Free for up to 4 travellers · Works offline"
        media={<PhoneMockup />}
      />

      <Container className="py-8">
        <p className="mb-6 text-center text-footnote font-semibold text-fg-muted">Trusted by travel partners across 30 countries</p>
        <LogoMarquee label="Partners">
          {PARTNERS.map((n) => (
            <span key={n} className="text-title3 font-bold whitespace-nowrap text-fg-subtle">{n}</span>
          ))}
        </LogoMarquee>
      </Container>

      <Section id="features" eyebrow="Features" title="Everything the group chat can't do." description="Less coordinating, more travelling." align="center">
        <FeatureGrid
          variant="bento"
          features={[
            {
              span: 2,
              rowSpan: 2,
              icon: <Map />,
              title: "One live itinerary",
              description: "Flights, stays and plans in a single timeline everyone can edit — and it works offline.",
              media: (
                <div className="flex h-56 items-end justify-center gap-3 bg-[linear-gradient(180deg,transparent,var(--pl-accent-soft))] px-6">
                  {["Belém", "Sintra", "Alfama"].map((d, i) => (
                    <div key={d} className="w-28 rounded-t-2xl bg-surface p-3 shadow-md" style={{ height: `${7 + i * 2}rem` }}>
                      <p className="text-caption1 text-fg-muted">Day {i + 1}</p>
                      <p className="text-subhead font-semibold">{d}</p>
                    </div>
                  ))}
                </div>
              ),
            },
            { icon: <Wallet />, title: "Split costs fairly", description: "Every currency, settled in one tap." },
            { icon: <BellRing />, title: "Alerts that matter", description: "Delays, gate changes and price drops." },
            { icon: <CalendarDays />, title: "In your calendar", description: "Bookings sync automatically." },
            { icon: <ShieldCheck />, title: "Private by default", description: "No ads. Your trips stay yours." },
            { icon: <MessageCircle />, title: "Decide together", description: "Polls for dinners, places and plans." },
          ]}
        />
      </Section>

      <Section tone="surface" spacing="md">
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {[
            { value: <CountUp to={128400} format={{ notation: "compact" }} />, label: "travellers this year" },
            { value: <CountUp to={4.9} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />, label: "App Store rating" },
            { value: <CountUp to={2.4e6} format={{ style: "currency", currency: "EUR", notation: "compact" }} />, label: "saved on bookings" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <p className="text-display">{s.value}</p>
              <p className="mt-1 text-subhead text-fg-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section spacing="lg">
        <ScrollRevealText
          className="mx-auto max-w-4xl text-title1 leading-tight font-bold md:text-[2.75rem] md:leading-[1.15]"
          text="The best trips are the ones where nobody had to be the organiser. Everyone sees the plan, everyone can change it, and the app quietly keeps it all in order."
        />
      </Section>

      <Section id="assistant" tone="dark" spacing="lg">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal effect="left">
            <p className="text-subhead font-semibold text-accent-ink">Assistant</p>
            <h2 className="mt-3 text-display-sm text-balance">Ask for a weekend. Get a plan.</h2>
            <p className="mt-4 text-title3 font-normal text-fg-muted">
              It compares trains and flights, checks opening hours, keeps to your budget — and shows its sources.
            </p>
            <Button size="lg" className="mt-8">Try the assistant</Button>
          </Reveal>
          <Reveal effect="zoom" className="grid place-items-center">
            <BotFace size={220} state="listening" track />
          </Reveal>
        </div>
      </Section>

      <Section eyebrow="Loved by groups" title="People actually finish planning." align="center">
        <Testimonials
          layout="carousel"
          items={[
            { name: "Sofia Rossi", role: "Organised 6 trips this year", rating: 5, quote: "We planned a 10-person trip to Lisbon in one evening. Nobody asked me for the hotel address once." },
            { name: "Omar Haddad", role: "Backpacker", rating: 5, quote: "The assistant found a train I didn't know existed and saved us a whole day." },
            { name: "Chiara Bianchi", role: "Family of four", rating: 4, quote: "Splitting costs used to end in arguments. Now it ends in a single tap." },
            { name: "Jonas Berg", role: "Travel agent", rating: 5, quote: "My clients get a live itinerary instead of a PDF. It looks native on their phones." },
            { name: "Aiko Tanaka", role: "Solo traveller", rating: 5, quote: "Offline maps and alerts in one place — it just feels calm to use." },
          ]}
        />
      </Section>

      <Section id="pricing" tone="surface" eyebrow="Pricing" title="Free for small groups." description="Upgrade when the group grows." align="center">
        <Pricing
          plans={[
            { id: "free", name: "Explorer", description: "For your first trips.", price: { monthly: 0, yearly: 0 }, features: ["Up to 4 travellers", "Shared itinerary", "Offline maps", { label: "AI assistant", included: false }], cta: <Button size="lg" variant="gray">Get started</Button> },
            { id: "plus", name: "Voyager", description: "For friends who travel often.", price: { monthly: 6, yearly: 4.5 }, highlighted: true, features: ["Up to 12 travellers", "AI assistant", "Cost splitting", "Price-drop alerts"], cta: <Button size="lg">Try 14 days free</Button> },
            { id: "team", name: "Agency", description: "For travel teams.", price: null, customPrice: "Let's talk", features: ["Unlimited travellers", "Client workspaces", "Custom branding"], cta: <Button size="lg" variant="tinted">Contact sales</Button> },
          ]}
        />
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Questions, answered." size="md" align="center">
        <Accordion type="single" collapsible variant="separated">
          {[
            ["Is it really free?", "Yes — up to 4 travellers per trip, forever. Voyager adds the assistant, bigger groups and alerts."],
            ["Does it work without a connection?", "Your itinerary, tickets and maps are stored on the phone, so they open anywhere."],
            ["Can I import bookings?", "Forward confirmation emails or share PDFs; flights and stays are added automatically."],
            ["Who can see my trips?", "Only the people you invite. We don't sell data or show ads."],
          ].map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Container className="pb-20">
        <CTA
          title="Your next trip starts tonight."
          description="Create a plan, invite your people, and let the details sort themselves out."
          actions={<Button size="lg" variant="surface" endIcon={<ArrowRight />}>Start planning — it's free</Button>}
        />
      </Container>

      <Footer
        brand={
          <>
            <Brand />
            <p>Plan trips together, from the first idea to the last photo.</p>
          </>
        }
      >
        <FooterColumns>
          {Object.entries({
            Product: ["Features", "Assistant", "Pricing", "Download"],
            Company: ["About", "Careers", "Press", "Contact"],
            Resources: ["Guides", "Help center", "Status", "Docs"],
            Legal: ["Privacy", "Terms", "Cookies"],
          }).map(([title, links]) => (
            <FooterColumn key={title} title={title}>
              {links.map((l) => (
                <FooterLink key={l} href="#">{l}</FooterLink>
              ))}
            </FooterColumn>
          ))}
        </FooterColumns>
        <FooterBottom>
          <span>© 2026 Plate. Built with pleate.</span>
          <span>Made for travellers, everywhere.</span>
        </FooterBottom>
      </Footer>
    </div>
  );
}
