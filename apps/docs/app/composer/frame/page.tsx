import type { Metadata } from "next";
import { FrameClient } from "@/components/composer/frame";

export const metadata: Metadata = { title: "Composer preview", robots: { index: false } };

export default function ComposerFramePage() {
  return <FrameClient />;
}
