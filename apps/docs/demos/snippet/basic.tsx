import { Snippet } from "pleate/snippet";

export default function Demo() {
  return (
    <div className="grid w-full max-w-xl gap-4">
      <Snippet
        language="bash"
        prompt="$"
        tabs={[
          { label: "npm", code: "npm install pleate" },
          { label: "pnpm", code: "pnpm add pleate" },
          { label: "yarn", code: "yarn add pleate" },
        ]}
      />
      <Snippet language="bash" prompt="$" code={"curl -H \"Authorization: Bearer $TOKEN\" https://api.example.com/v1/trips/lisbon-2026/bookings?status=confirmed&include=travellers,seats"} />
    </div>
  );
}
