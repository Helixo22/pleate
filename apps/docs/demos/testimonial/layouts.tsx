import { Testimonials } from "pleate/marketing/testimonial";

const ITEMS = [
  { name: "Sofia Rossi", role: "Organised 6 trips", rating: 5, quote: "We planned a 10-person trip to Lisbon in one evening. Nobody asked me for the hotel address once." },
  { name: "Omar Haddad", role: "Backpacker", rating: 5, quote: "The assistant found a train I didn't know existed and saved us a whole day." },
  { name: "Chiara Bianchi", role: "Family of four", rating: 4, quote: "Splitting costs used to end in arguments. Now it ends in a single tap." },
  { name: "Jonas Berg", role: "Travel agent", rating: 5, quote: "My clients get a beautiful, live itinerary instead of a PDF. It looks native on their phones." },
  { name: "Aiko Tanaka", role: "Solo traveller", rating: 5, quote: "Offline maps and alerts in one place. It just feels calm to use." },
];

const MORE = [
  { name: "Elena Marković", role: "Weekend city breaker", rating: 5, quote: "The packing list and the weather sit next to the tickets. I stopped opening four apps." },
  { name: "Tomás Ferreira", role: "Group organiser", rating: 5, quote: "Eight friends, three countries, one shared budget. Nobody got lost." },
  { name: "Priya Nair", role: "Frequent flyer", rating: 4, quote: "Gate changes reach me before the airport screens update." },
  { name: "Lars Eriksen", role: "Road tripper", rating: 5, quote: "Offline routes saved us twice in the mountains." },
  { name: "Mia Okafor", role: "Student on a budget", rating: 5, quote: "Seeing what each person owes before we book changed how we plan." },
  { name: "Hugo Laurent", role: "Photographer", rating: 5, quote: "Golden hour times and the route in one place. Exactly what I wanted." },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-14 rounded-3xl bg-bg p-4 md:p-8">
      <Testimonials layout="featured" items={[{ name: "Jonas Berg", role: "Travel agent", quote: "It's the first travel app my clients open without me asking them to." }]} />
      <Testimonials layout="grid" items={[...ITEMS.filter((t) => t.name !== "Jonas Berg"), ...MORE.slice(2, 4)]} />
      <Testimonials layout="carousel" items={[MORE[0], MORE[1], ...MORE.slice(4)]} />
    </div>
  );
}
