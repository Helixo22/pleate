// PageTransition: animates each new page in. Next's App Router re-mounts app/template.tsx on every navigation, so
// wrap the template's children:
//     export default function Template({ children }) { return <PageTransition>{children}</PageTransition>; }
// "slide" mimics an iOS push — from the trailing side going forward, from the leading side on Back (the browser's
// back/forward buttons are detected). "fade" and "fade-up" are calmer. Instant with reduced motion.
"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

let lastNavigation: "forward" | "back" = "forward";
let listening = false;

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("popstate", () => {
    lastNavigation = "back";
  });
}

/** "back" when the current page was reached with the browser's back/forward buttons. */
export function useNavigationDirection() {
  const [direction] = useState(() => lastNavigation);
  useEffect(() => {
    listen();
    lastNavigation = "forward";
  }, []);
  return direction;
}

export type PageTransitionProps = {
  children: ReactNode;
  variant?: "fade" | "fade-up" | "slide";
  className?: string;
};

export function PageTransition({ children, variant = "fade-up", className }: PageTransitionProps) {
  const reduced = useReducedMotion();
  const direction = useNavigationDirection();
  useEffect(() => {
    // Land at the top on forward navigations; the browser restores the position on Back.
    if (direction === "forward") window.scrollTo({ top: 0 });
  }, [direction]);
  if (reduced) return <div className={className}>{children}</div>;
  const back = direction === "back";
  const initial =
    variant === "slide" ? { opacity: 0, x: back ? "-12%" : "12%" } : variant === "fade-up" ? { opacity: 0, y: 14 } : { opacity: 0 };
  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={variant === "slide" ? spring.sheet : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
