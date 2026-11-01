import { FuzzyText } from "pleate/effects/fuzzy-text";

export default function Demo() {
  return (
    <div className="grid justify-items-center gap-2">
      <FuzzyText text="404" className="text-[6rem] font-black" />
      <p className="text-subhead text-fg-muted">Hover the number.</p>
    </div>
  );
}
