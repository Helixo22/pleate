import type { Metadata } from "next";
import { Composer } from "@/components/composer/composer";

export const metadata: Metadata = {
  title: "Composer",
  description: "Build pages from pleate sections, theme them and export the TSX.",
};

export default function ComposerPage() {
  return <Composer />;
}
