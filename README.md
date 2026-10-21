# pleate

iOS-inspired React components, design tokens and themes for Next.js (App Router) and Tailwind CSS v4.

- **Solid, not glass** — opaque surfaces, soft shadows, generous radii, airy spacing.
- **Themes at runtime** — light / dark / system, ten palettes, or a full palette generated from one color (OKLCH, WCAG AA checked).
- **Accessible** — Radix primitives, keyboard support, visible focus, `prefers-reduced-motion` respected everywhere.
- **Tree-shakable** — one module per component (`pleate/button`, `pleate/ai/chat`, `pleate/effects/reveal`, `pleate/marketing/hero`…), `"use client"` only where needed.
- **AI-ready** — chat, composer, streaming text, reasoning, sources and an expressive, voice-reactive assistant avatar.

## Install

```bash
npm install pleate
```

```css
/* app/globals.css */
@import "tailwindcss";
@import "pleate/styles.css";
@source "../node_modules/pleate/dist";
```

```tsx
// app/layout.tsx
import { ThemeProvider, ThemeScript } from "pleate/theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

```tsx
import { Button } from "pleate/button";

<Button variant="tinted" size="lg">Book trip</Button>;
```

## Theming

```tsx
const { setTheme, setPalette, setCustomColor } = useTheme();
setTheme("dark");
setPalette("teal");
setCustomColor("#ff2d55");
```

Tokens are CSS variables prefixed `--pl-` (`--pl-accent`, `--pl-surface`, `--pl-radius`…) exposed as Tailwind utilities
(`bg-surface`, `text-accent-ink`, `rounded-xl`, `text-headline`). `--pl-roundness` scales every radius at once.

## Repository

| Path | |
|---|---|
| `packages/pleate` | the library (`npm run build -w pleate`, `npm run palettes -w pleate`) |
| `apps/docs` | documentation, live demos and an example landing page (`npm run dev`) |

## Roadmap

- [x] Tokens, palettes, theme runtime, motion
- [x] Base: Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Badge, Avatar, Tag, Label, Spinner
- [x] Layout: Container, Stack, Grid, Card, Divider, Section, Navbar, NavigationBar (iOS large title), Sidebar, Footer, TabBar
- [x] Navigation: Tabs, SegmentedControl, Breadcrumb, Pagination, Menu, ContextMenu, Dropdown
- [x] Overlay: Modal, BottomSheet (drag + snap points), ActionSheet, AlertDialog, Popover, Tooltip, Toast, Alert
- [x] Feedback: Skeleton, Progress (bar + ring), EmptyState
- [x] Data: Table (sortable, stacks on phones), List (iOS Settings, swipe actions), Accordion, Timeline, StatCard
- [x] Forms: Form + FormField (validation), Calendar, DatePicker (single, range, presets), SearchBar, FileUpload
- [x] AI (`pleate/ai/*`): BotFace (voice-reactive), ChatThread + Message, Composer, StreamingText, PromptSuggestions, ResultCard + sources, ModelPicker, Reasoning
- [x] Effects (`pleate/effects/*`): animated text (blur, rotating, gradient, shiny, decrypted, count-up, scroll-lit), Reveal + groups, ScrollProgress, Parallax, PageTransition, Magnet, Spotlight, Tilt, ClickSpark
- [x] Marketing (`pleate/marketing/*`): Hero, FeatureGrid (cards, bento), Pricing, Testimonials, CTA + Newsletter, LogoMarquee

## License

MIT
