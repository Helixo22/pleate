import { Grid } from "pleate/grid";

const Tile = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-20 place-items-center rounded-xl bg-fill-2 text-subhead font-semibold text-fg-muted">{children}</div>
);

export default function Demo() {
  return (
    <div className="grid w-full gap-8">
      <Grid columns={{ base: 2, md: 3, lg: 4 }} gap={3}>
        {Array.from({ length: 8 }, (_, i) => (
          <Tile key={i}>{i + 1}</Tile>
        ))}
      </Grid>
      <Grid minItemWidth="9rem" gap={3}>
        {Array.from({ length: 6 }, (_, i) => (
          <Tile key={i}>auto-fill</Tile>
        ))}
      </Grid>
    </div>
  );
}
