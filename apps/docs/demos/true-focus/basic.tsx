import { TrueFocus } from "pleate/effects/true-focus";

export default function Demo() {
  return (
    <div className="grid gap-10">
      <TrueFocus text="Plan Pack Travel Return" className="text-display-sm font-bold" />
      <TrueFocus manual text="Hover any word" className="text-title2" />
    </div>
  );
}
