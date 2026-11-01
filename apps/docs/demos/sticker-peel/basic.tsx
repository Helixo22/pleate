"use client";

import { useRef } from "react";
import { StickerPeel } from "pleate/effects/sticker-peel";

export default function Demo() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="flex h-80 w-full items-center justify-center gap-10 rounded-xl bg-fill-3">
      <StickerPeel dragConstraints={box} width={150} rotate={-8}>
        <svg viewBox="0 0 100 100" role="img" aria-label="Smiling sun sticker" className="block">
          <circle cx="50" cy="50" r="48" fill="#fff" />
          <circle cx="50" cy="50" r="40" fill="var(--pl-accent)" />
          <circle cx="38" cy="44" r="5" fill="#fff" />
          <circle cx="62" cy="44" r="5" fill="#fff" />
          <path d="M34 60q16 14 32 0" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      </StickerPeel>
      <StickerPeel dragConstraints={box} width={170} rotate={6}>
        <img src="https://picsum.photos/seed/pleate-sticker/340/340" alt="Photo sticker of a beach" className="block rounded-lg border-[6px] border-white" />
      </StickerPeel>
    </div>
  );
}
