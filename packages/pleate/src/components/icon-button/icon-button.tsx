// IconButton: a square or round Button holding only an icon. The accessible name is required, since there is no text.
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Button, type ButtonProps } from "../button/button.tsx";

export type IconButtonProps = Omit<ButtonProps, "startIcon" | "endIcon" | "iconOnly" | "fullWidth" | "children"> & {
  "aria-label": string;
  icon?: ReactNode;
  children?: ReactNode;
};

export function IconButton({ icon, children, variant = "gray", className, ...props }: IconButtonProps) {
  return (
    <Button variant={variant} iconOnly className={cn(className)} {...props}>
      {icon ?? children}
    </Button>
  );
}
