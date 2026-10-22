import { BotFace } from "pleate/ai/bot-face";

export default function Demo() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-wrap items-end justify-center gap-6">
        {[24, 32, 48, 64, 96].map((size) => (
          <BotFace key={size} size={size} dot={size >= 32} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {["atlas", "nova", "juno", "pico", "vega"].map((seed, i) => (
          <BotFace
            key={seed}
            seed={seed}
            size={64}
            state={i === 1 ? "happy" : i === 3 ? "waiting" : "idle"}
            color={["var(--pl-accent)", "var(--pl-info)", "var(--pl-success)", "var(--pl-warning)", "var(--pl-fg)"][i]}
            eyeColor={i === 4 ? "var(--pl-bg)" : undefined}
          />
        ))}
      </div>
      <div className="flex items-center gap-6">
        <BotFace size={64} animated={false} state="thinking" />
        <span className="text-footnote text-fg-muted">animated=false: still pose, no listeners</span>
      </div>
    </div>
  );
}
