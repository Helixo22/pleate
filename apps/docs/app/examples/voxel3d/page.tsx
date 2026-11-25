import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import { Landing } from "./landing";

const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "Voxel landing page example",
  description: "A landing page built with pleate and its Voxel3D section: the whole building assembles as you scroll.",
};

export default function Page() {
  return (
    <div className={pixelify.variable}>
      <Landing />
    </div>
  );
}
