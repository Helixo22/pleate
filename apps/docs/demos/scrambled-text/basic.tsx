import { ScrambledText } from "pleate/effects/scrambled-text";

export default function Demo() {
  return (
    <ScrambledText
      className="max-w-2xl font-mono text-title3 leading-relaxed"
      text="Run your pointer across this paragraph. The letters close to it break into symbols and settle back once you move on."
    />
  );
}
