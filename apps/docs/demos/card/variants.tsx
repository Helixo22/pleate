import { Card, CardDescription, CardHeader, CardTitle } from "pleate/card";
import { Grid } from "pleate/grid";

const VARIANTS = {
  elevated: "Surface with a hairline edge.",
  flat: "Plain surface, no edge.",
  filled: "Gray fill.",
  outline: "Transparent with an inset border.",
  raised: "Lifted with a large shadow.",
} as const;

export default function Demo() {
  return (
    <div className="w-full rounded-xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
        {(Object.keys(VARIANTS) as (keyof typeof VARIANTS)[]).map((variant) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle className="capitalize">{variant}</CardTitle>
              <CardDescription>{VARIANTS[variant]}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
