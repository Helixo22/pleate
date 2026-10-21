import { Bookmark, Star } from "lucide-react";
import { ResultCard, SourceChip, SourceList } from "pleate/ai/result-card";
import { Badge } from "pleate/badge";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid w-full gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        <ResultCard
          index={1}
          href="https://example.com/alfama"
          site="lisbon-guide.example"
          title="Alfama: the oldest neighborhood in Lisbon"
          snippet="Narrow streets, viewpoints over the Tagus and fado houses. Best explored on foot in the early morning or at sunset."
          meta={
            <>
              <span className="inline-flex items-center gap-0.5"><Star className="size-3" fill="currentColor" /> 4.8</span>
              <span>· 12 min read</span>
            </>
          }
          tags={<><Badge size="sm" tone="neutral">Walking</Badge><Badge size="sm" tone="neutral">Views</Badge></>}
        />
        <ResultCard
          layout="horizontal"
          index={2}
          image="https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&q=70"
          imageAlt="Yellow tram in Lisbon"
          href="https://example.com/tram-28"
          title="Tram 28 — the classic ride"
          snippet="Board at Martim Moniz to get a seat; the full loop takes about 50 minutes."
          actions={<Button size="xs" variant="tinted" startIcon={<Bookmark />}>Save</Button>}
        />
      </div>
      <p className="max-w-xl text-body">
        Pastéis de Belém opens at 8:00 and the queue is shortest before 10<SourceChip index={1} href="https://example.com/a" site="lisbon-guide.example" />;
        the monastery next door is free on Sundays for residents<SourceChip index={2} href="https://example.com/b" />.
      </p>
      <SourceList
        sources={[
          { href: "https://www.visitlisboa.com", title: "Visit Lisboa — official tourism guide" },
          { href: "https://www.parquesdesintra.pt", title: "Parques de Sintra — tickets and hours" },
          { href: "https://www.cp.pt", title: "CP trains timetable" },
          { href: "https://en.wikipedia.org/wiki/Bel%C3%A9m_Tower", title: "Belém Tower — Wikipedia" },
        ]}
      />
    </div>
  );
}
