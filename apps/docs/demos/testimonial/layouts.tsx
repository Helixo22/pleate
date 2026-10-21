import { Testimonials } from "pleate/marketing/testimonial";

const ITEMS = [
  { name: "Sofia Rossi", role: "Organised 6 trips this year", rating: 5, quote: "We planned a 10-person trip to Lisbon in one evening. Nobody asked me for the hotel address once." },
  { name: "Omar Haddad", role: "Backpacker", rating: 5, quote: "The assistant found a train I didn't know existed and saved us a whole day." },
  { name: "Chiara Bianchi", role: "Family of four", rating: 4, quote: "Splitting costs used to end in arguments. Now it ends in a single tap." },
  { name: "Jonas Berg", role: "Travel agent", rating: 5, quote: "My clients get a beautiful, live itinerary instead of a PDF. It looks native on their phones." },
  { name: "Aiko Tanaka", role: "Solo traveller", rating: 5, quote: "Offline maps and alerts in one place — it just feels calm to use." },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-14 rounded-3xl bg-bg p-4 md:p-8">
      <Testimonials layout="featured" items={[{ ...ITEMS[3], quote: "It's the first travel app my clients open without me asking them to." }]} />
      <Testimonials layout="grid" items={ITEMS} />
      <Testimonials layout="carousel" items={ITEMS} />
    </div>
  );
}
