import { Pause, SkipBack, SkipForward } from "lucide-react";
import { GlassSurface } from "pleate/effects/glass-surface";

export default function Demo() {
  return (
    <div
      className="grid w-full place-items-center rounded-3xl p-10 sm:p-16"
      style={{ background: "url(https://picsum.photos/seed/pleate-glass/1200/700) center / cover" }}
    >
      <GlassSurface className="flex w-full max-w-sm items-center gap-4 p-4 text-white">
        <img src="https://picsum.photos/seed/pleate-album/120/120" alt="Album cover" className="size-14 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-headline">Night Drive</p>
          <p className="truncate text-subhead text-white/75">Low Tide Club</p>
        </div>
        <div className="flex gap-1 [&_button]:grid [&_button]:size-9 [&_button]:place-items-center [&_button]:rounded-full [&_svg]:size-5">
          <button type="button" aria-label="Previous"><SkipBack /></button>
          <button type="button" aria-label="Pause"><Pause /></button>
          <button type="button" aria-label="Next"><SkipForward /></button>
        </div>
      </GlassSurface>
    </div>
  );
}
