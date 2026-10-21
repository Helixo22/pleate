import { Textarea } from "pleate/textarea";

export default function Demo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <Textarea aria-label="Notes" placeholder="Grows as you type…" minRows={2} maxRows={8} />
      <Textarea aria-label="Bio" variant="outline" placeholder="Tell travellers about yourself" maxLength={160} showCount />
    </div>
  );
}
