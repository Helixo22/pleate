// Hero: the opening of a page. "center" stacks everything on the axis; "split" puts the copy beside a visual.
// An announcement pill, a display title (any ReactNode: RotatingText, GradientText…), a description, actions, a
// small footnote and the media. Elements rise in one after another. background: plain page, a soft accent wash,
// or a dark band (its own theme).
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Container, type ContainerProps } from "../../components/container/container.tsx";

export type HeroProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Small pill above the title ("New · Group trips →"). */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Trust line under the actions ("Free · No card needed"). */
  footnote?: ReactNode;
  /** Image, mockup, BotFace… */
  media?: ReactNode;
  layout?: "center" | "split";
  background?: "plain" | "wash" | "dark";
  size?: "md" | "lg";
  container?: ContainerProps["size"];
  className?: string;
};

export function Hero({
  title,
  description,
  eyebrow,
  actions,
  footnote,
  media,
  layout = "center",
  background = "plain",
  size = "lg",
  container = "xl",
  className,
}: HeroProps) {
  const reduced = useReducedMotion();
  const split = layout === "split";
  const item = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18, filter: "blur(6px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
        };
  return (
    <section
      data-theme={background === "dark" ? "dark" : undefined}
      className={cn(
        "relative isolate overflow-hidden text-fg",
        background === "dark" && "bg-bg",
        size === "lg" ? "py-20 md:py-32" : "py-14 md:py-20",
        className,
      )}
    >
      {background === "wash" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--pl-accent-soft),transparent_70%)]"
        />
      )}
      <Container size={container} className={cn("grid items-center gap-12", split ? "lg:grid-cols-[1.05fr_1fr] lg:gap-16" : "justify-items-center text-center")}>
        <div className={cn("flex flex-col gap-6", split ? "items-start" : "max-w-4xl items-center")}>
          {eyebrow && (
            <motion.div {...item(0)} className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-footnote font-semibold text-accent-ink [&_a]:pl-focus-ring">
              {eyebrow}
            </motion.div>
          )}
          <motion.h1 {...item(1)} className={cn("text-balance", size === "lg" ? "text-display-xl" : "text-display")}>
            {title}
          </motion.h1>
          {description && (
            <motion.p {...item(2)} className={cn("max-w-2xl text-pretty text-fg-muted", size === "lg" ? "text-title3 font-normal md:text-[1.375rem] md:leading-8" : "text-title3 font-normal")}>
              {description}
            </motion.p>
          )}
          {actions && (
            <motion.div {...item(3)} className={cn("mt-2 flex flex-wrap gap-3", !split && "justify-center")}>
              {actions}
            </motion.div>
          )}
          {footnote && (
            <motion.p {...item(4)} className="text-footnote text-fg-muted">
              {footnote}
            </motion.p>
          )}
        </div>
        {media && (
          <motion.div
            {...(reduced
              ? {}
              : { initial: { opacity: 0, y: 32, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] } })}
            className={cn("w-full", !split && "max-w-5xl")}
          >
            {media}
          </motion.div>
        )}
      </Container>
    </section>
  );
}
