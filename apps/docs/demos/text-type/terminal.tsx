import { TextType } from "pleate/effects/text-type";

export default function Demo() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-surface-2 p-5 font-mono text-callout">
      <span className="text-fg-subtle">$ </span>
      <TextType text="npm install pleate" loop={false} cursor="_" typingSpeed={70} />
    </div>
  );
}
