import { TextType } from "pleate/effects/text-type";

export default function Demo() {
  return (
    <p className="text-title1 font-semibold">
      <TextType text={["Book the flight.", "Find a quiet hotel.", "Leave the rest to us."]} />
    </p>
  );
}
