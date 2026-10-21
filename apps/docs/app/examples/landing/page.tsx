import type { Metadata } from "next";
import { Landing } from "./landing";

export const metadata: Metadata = {
  title: "Landing page example",
  description: "A complete marketing page built only with pleate components.",
};

export default function Page() {
  return <Landing />;
}
