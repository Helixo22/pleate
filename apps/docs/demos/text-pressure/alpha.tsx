import { TextPressure } from "pleate/effects/text-pressure";

export default function Demo() {
  return <TextPressure text="Hello there" stretch={false} alpha minWeight={100} className="max-w-xl text-accent-ink" />;
}
