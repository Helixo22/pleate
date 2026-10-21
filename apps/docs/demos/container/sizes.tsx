import { Container } from "pleate/container";

export default function Demo() {
  return (
    <div className="grid w-full gap-2 rounded-2xl bg-bg py-4">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Container key={size} size={size} gutter="sm">
          <div className="rounded-lg bg-accent-soft py-2 text-center font-mono text-footnote text-accent-ink">size="{size}"</div>
        </Container>
      ))}
    </div>
  );
}
