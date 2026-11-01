import { HoloCard } from "pleate/effects/holo-card";

export default function Demo() {
  return (
    <HoloCard className="aspect-[5/7] w-64">
      <div className="flex h-full flex-col bg-[linear-gradient(160deg,#1e3a8a,#0f172a)] p-3 text-white">
        <div className="flex items-baseline justify-between px-1">
          <p className="text-headline">Aurora Fox</p>
          <p className="text-footnote font-semibold">HP 120</p>
        </div>
        <img src="https://picsum.photos/seed/pleate-fox/400/300" alt="A misty forest" className="mt-2 aspect-[4/3] w-full rounded-xl object-cover" />
        <p className="mt-3 px-1 text-footnote text-white/80">Glides over snow without a sound. Appears only on clear nights.</p>
        <p className="mt-auto px-1 text-caption2 text-white/60">No. 042 / 150</p>
      </div>
    </HoloCard>
  );
}
