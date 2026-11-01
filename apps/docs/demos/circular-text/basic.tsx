import { CircularText } from "pleate/effects/circular-text";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-12">
      <CircularText text="PLEATE • MADE FOR NEXT • " className="text-footnote tracking-widest" />
      <div className="relative grid size-[140px] place-items-center rounded-full bg-accent text-on-accent">
        <CircularText text="NEW SEASON • NEW SEASON • " size={140} onHover="pause" seconds={14} className="absolute inset-0 p-2 text-caption1" />
        <span className="text-headline">2026</span>
      </div>
    </div>
  );
}
