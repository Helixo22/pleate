import { ShapeBlur } from "pleate/effects/shape-blur";

export default function Demo() {
  return (
    <ShapeBlur blur={12} radius={120}>
      <div className="flex items-center gap-4 p-6 text-fg">
        <svg viewBox="0 0 48 48" className="size-20" aria-hidden="true">
          <rect x="4" y="4" width="40" height="40" rx="12" fill="var(--pl-accent)" />
          <circle cx="24" cy="24" r="8" fill="var(--pl-bg)" />
        </svg>
        <span className="font-brand text-display">pleate</span>
      </div>
    </ShapeBlur>
  );
}
