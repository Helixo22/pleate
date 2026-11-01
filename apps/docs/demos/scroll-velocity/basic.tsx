import { ScrollVelocity } from "pleate/effects/scroll-velocity";

export default function Demo() {
  return (
    <ScrollVelocity
      texts={["Scroll faster", "Scroll back to turn it around"]}
      rowClassName="text-display-sm font-semibold tracking-tight [&:nth-child(even)]:text-accent"
    />
  );
}
