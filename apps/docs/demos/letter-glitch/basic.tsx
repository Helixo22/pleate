import { LetterGlitch } from "pleate/effects/letter-glitch";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <LetterGlitch className="absolute inset-0" />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Signal in the noise</h2>
    </div>
  );
}
