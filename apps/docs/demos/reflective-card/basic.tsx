import { ReflectiveCard } from "pleate/effects/reflective-card";

export default function Demo() {
  return (
    <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
      {(["silver", "graphite"] as const).map((metal) => (
        <ReflectiveCard key={metal} metal={metal}>
          <div className="flex h-full flex-col">
            <p className="text-caption1 font-semibold tracking-wide opacity-70">ACCESS CARD</p>
            <p className="mt-auto text-title3">Ada Moretti</p>
            <p className="font-mono text-footnote opacity-70">ID 0042 7781 3390</p>
          </div>
        </ReflectiveCard>
      ))}
    </div>
  );
}
