import { GlitchText } from "pleate/effects/glitch-text";

export default function Demo() {
  return (
    <div className="grid gap-8 text-center">
      <GlitchText as="h3" className="font-brand text-display-sm font-bold">SIGNAL LOST</GlitchText>
      <p className="text-title3">
        Only on hover: <GlitchText onHover speed={0.3} className="font-semibold">static</GlitchText>
      </p>
    </div>
  );
}
