import { Snippet } from "pleate/snippet";

const code = `{
  "trip": "lisbon-2026",
  "travellers": 3,
  "stays": [
    { "city": "Lisbon", "nights": 4, "hotel": "Casa do Bairro, Rua da Rosa 112, Bairro Alto" },
    { "city": "Sintra", "nights": 1, "hotel": "Quinta das Murtas" },
    { "city": "Porto", "nights": 3, "hotel": "Ribeira Flats" }
  ],
  "flights": ["TP 1351", "TP 1946"]
}`;

export default function Demo() {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Snippet language="json" code={code} maxHeight={160} />
      <Snippet language="json" code={code} wrap />
    </div>
  );
}
