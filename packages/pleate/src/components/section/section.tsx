// Section: a full-width page band with generous vertical rhythm, an optional heading block (eyebrow, title,
// description) and a centered Container. tone="dark" / "light" pins its own theme — the black bands of a product
// page — and "surface" / "accent-soft" tint it.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { Container, type ContainerProps } from "../container/container.tsx";

// overflow-x-clip: content entering from the side (Reveal left/right) never widens the page; unlike hidden it
// keeps sticky children working.
export const sectionVariants = cva("relative w-full overflow-x-clip text-fg", {
  variants: {
    spacing: {
      none: "",
      sm: "py-10 md:py-14",
      md: "py-16 md:py-24",
      lg: "py-20 md:py-32",
    },
    tone: {
      default: "",
      surface: "bg-surface",
      muted: "bg-bg",
      "accent-soft": "bg-accent-soft",
      dark: "bg-bg",
      light: "bg-bg",
    },
  },
  defaultVariants: { spacing: "md", tone: "default" },
});

export type SectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> &
  VariantProps<typeof sectionVariants> & {
    ref?: Ref<HTMLElement>;
    eyebrow?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    /** Heading block alignment. */
    align?: "start" | "center";
    /** Container width; "none" renders children without a container. */
    size?: ContainerProps["size"] | "none";
    /** Heading level of the title. */
    titleAs?: "h1" | "h2" | "h3";
  };

export function Section({
  className,
  spacing,
  tone,
  eyebrow,
  title,
  description,
  align = "start",
  size = "xl",
  titleAs: Title = "h2",
  children,
  ...props
}: SectionProps) {
  const header = (eyebrow || title || description) && (
    <div className={cn("mb-10 flex max-w-3xl flex-col gap-3 md:mb-14", align === "center" && "mx-auto items-center text-center")}>
      {eyebrow && <p className="text-subhead font-semibold text-accent-ink">{eyebrow}</p>}
      {title && <Title className="text-display-sm text-balance">{title}</Title>}
      {description && <p className="text-title3 font-normal text-pretty text-fg-muted">{description}</p>}
    </div>
  );
  return (
    <section
      data-theme={tone === "dark" || tone === "light" ? tone : undefined}
      className={cn(sectionVariants({ spacing, tone }), className)}
      {...props}
    >
      {size === "none" ? (
        <>
          {header}
          {children}
        </>
      ) : (
        <Container size={size}>
          {header}
          {children}
        </Container>
      )}
    </section>
  );
}
