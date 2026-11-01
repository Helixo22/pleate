import { ArrowRight, Plane, Utensils, Wallet } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardIcon, CardTitle } from "pleate/card";
import { Grid } from "pleate/grid";

const CARDS = [
  { tint: "#007aff", icon: <Plane />, title: "Flights", text: "IB3117 to Lisbon, Thursday 09:40, seat 14A", cta: "Boarding pass" },
  { tint: "#ff9500", icon: <Utensils />, title: "Dinner", text: "Casa do Fado, table for two at 20:30", cta: "Directions" },
  { tint: "#34c759", icon: <Wallet />, title: "Budget", text: "€412 of €900 spent, 4 days to go", cta: "Expenses" },
];

export default function Demo() {
  return (
    <div className="w-full rounded-xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, md: 3 }} gap={4}>
        {CARDS.map((c) => (
          <Card key={c.title} tint={c.tint} interactive asChild>
            <a href="#card">
              <CardIcon>{c.icon}</CardIcon>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.text}</CardDescription>
              </CardHeader>
              <CardFooter className="text-subhead font-semibold text-(--pl-card-tint)">
                {c.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </CardFooter>
            </a>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
