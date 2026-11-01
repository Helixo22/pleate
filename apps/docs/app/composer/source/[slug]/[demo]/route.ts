// The source of one docs demo, for the composer's code export. Prerendered for every demo file at build time;
// anything else is a 404, so the path can never leave demos/.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DEMOS = path.join(process.cwd(), "demos");

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return readdirSync(DEMOS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "bits")
    .flatMap((d) =>
      readdirSync(path.join(DEMOS, d.name))
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => ({ slug: d.name, demo: f.slice(0, -4) })),
    );
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; demo: string }> }) {
  const { slug, demo } = await params;
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(demo)) return new Response("Not found", { status: 404 });
  try {
    return new Response(readFileSync(path.join(DEMOS, slug, `${demo}.tsx`), "utf8"), { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
