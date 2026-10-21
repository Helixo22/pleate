import { Card, CardDescription, CardHeader, CardTitle } from "pleate/card";
import { Grid } from "pleate/grid";

const VARIANTS = ["elevated", "flat", "filled", "outline", "raised"] as const;

export default function Demo() {
  return (
    <div className="w-full rounded-3xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
        {VARIANTS.map((variant) => (
          <Card key={variant} variant={variant}>
            <CardHeader>
              <CardTitle className="capitalize">{variant}</CardTitle>
              <CardDescription>Solid surface, soft edges.</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
