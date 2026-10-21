// Motion tokens for Motion (framer-motion) springs and tweens, twins of the CSS ones in styles/tokens.css.
// snap: small controls (thumbs, pills, toggles) · sheet: panels sliding in · soft: entrances and reveals ·
// bouncy: playful accents (avatars, success marks).

export const spring = {
  snap: { type: "spring", stiffness: 520, damping: 40, mass: 0.9 },
  sheet: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
  soft: { type: "spring", stiffness: 260, damping: 30 },
  bouncy: { type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
} as const;

export const duration = { instant: 0.1, fast: 0.16, base: 0.24, slow: 0.4 } as const;

export const ease = {
  ios: [0.32, 0.72, 0, 1],
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;
