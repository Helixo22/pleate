// <ThemeScript /> — put it in <head> of the root layout (with suppressHydrationWarning on <html>). It applies the
// stored theme, palette and motion choice before the first paint, so there is no flash of the wrong theme.
import { bootScript, type ThemeConfig } from "./config.ts";

export function ThemeScript({ nonce, ...config }: ThemeConfig & { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: bootScript(config) }} />;
}
