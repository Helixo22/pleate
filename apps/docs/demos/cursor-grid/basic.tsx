import { CursorGrid } from "pleate/effects/cursor-grid";

export default function Demo() {
  return (
    <CursorGrid className="grid h-80 w-full place-items-center overflow-hidden rounded-xl bg-surface">
      <div className="text-center">
        <p className="text-title1">Dots wake up</p>
        <p className="text-subhead text-fg-muted">Near the cursor they swell and take the accent.</p>
      </div>
    </CursorGrid>
  );
}
