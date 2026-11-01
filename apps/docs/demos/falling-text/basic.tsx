import { FallingText } from "pleate/effects/falling-text";

export default function Demo() {
  return (
    <FallingText
      text="Pleate gives you calm surfaces, honest motion and colors that follow your palette. Drag the words around once they land."
      highlightWords={["calm", "motion", "palette"]}
      className="max-w-xl rounded-2xl bg-surface text-title3 font-semibold"
    />
  );
}
