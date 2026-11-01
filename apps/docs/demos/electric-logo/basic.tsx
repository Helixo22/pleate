import { ElectricLogo } from "pleate/effects/electric-logo";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-12 py-6">
      <ElectricLogo>
        <svg viewBox="0 0 24 24" className="size-28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-label="Bolt">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      </ElectricLogo>
      <ElectricLogo color="var(--pl-fg)" chaos={3}>
        <span className="font-brand text-display">pleate</span>
      </ElectricLogo>
    </div>
  );
}
