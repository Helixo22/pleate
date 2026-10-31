import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "pleate/motion";
import { ThemeProvider, ThemeScript } from "pleate/theme";
import { Toaster } from "pleate/toast";
import { Shell } from "@/components/shell";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "pleate", template: "%s · pleate" },
  description: "React components, design tokens and themes for Next.js.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#141415" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <Shell>{children}</Shell>
            <Toaster />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
