// SpotlightCard: a card with a soft light that follows the pointer across it. Built on pleate's Spotlight effect,
// with card styling; touch screens and reduced motion get the plain card.
"use client";

import { cn } from "../../lib/cn.ts";
import { Spotlight, type SpotlightProps } from "../hover/hover.tsx";

export type SpotlightCardProps = Omit<SpotlightProps, "color"> & {
  /** Light color (CSS). Defaults to a soft accent. */
  spotlightColor?: string;
};

export function SpotlightCard({ spotlightColor = "color-mix(in oklab, var(--pl-accent) 22%, transparent)", size = 360, className, ...props }: SpotlightCardProps) {
  return <Spotlight color={spotlightColor} size={size} className={cn("rounded-3xl bg-surface p-7 pl-field [--pl-field-border:var(--pl-separator)]", className)} {...props} />;
}
