import { MapPin, Star } from "lucide-react";
import { Badge } from "pleate/badge";
import { Button } from "pleate/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle } from "pleate/card";
import { Grid } from "pleate/grid";

export default function Demo() {
  return (
    <div className="w-full rounded-3xl bg-bg p-4 md:p-6">
      <Grid columns={{ base: 1, md: 2 }} gap={4}>
        <Card>
          <CardMedia>
            <div className="aspect-[16/9] bg-[linear-gradient(135deg,var(--pl-accent-300),var(--pl-accent-700))]" />
          </CardMedia>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Alfama rooftop flat</CardTitle>
              <Badge tone="neutral" className="gap-0.5">
                <Star className="size-3" fill="currentColor" /> 4.9
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="size-3.5" /> Lisbon, Portugal
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <span className="text-headline">€128</span>
            <span className="text-subhead text-fg-muted">/ night</span>
            <Button size="sm" className="ms-auto">Reserve</Button>
          </CardFooter>
        </Card>

        <Card asChild interactive>
          <a href="#composed">
            <CardHeader>
              <CardTitle>Interactive card</CardTitle>
              <CardDescription>The whole card is a link: it lifts on hover and presses in.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-subhead text-fg-muted">
                Use <code className="font-mono">asChild</code> with an anchor or a Next <code className="font-mono">Link</code>.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-subhead font-semibold text-accent-ink">Open trip →</span>
            </CardFooter>
          </a>
        </Card>
      </Grid>
    </div>
  );
}
