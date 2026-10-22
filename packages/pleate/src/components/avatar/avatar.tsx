// Avatar: photo with a graceful fallback, initials on a gradient whose hue comes from the name (stable per person),
// or a custom icon. Circle or rounded square, six sizes, optional presence dot. AvatarGroup overlaps a row of avatars
// and folds the rest into "+N".
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { Children, createContext, useContext, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center align-middle font-semibold text-on-status select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.625rem] [&_svg]:size-3.5",
        sm: "size-8 text-caption1 [&_svg]:size-4",
        md: "size-10 text-subhead [&_svg]:size-5",
        lg: "size-14 text-title3 [&_svg]:size-7",
        xl: "size-20 text-title1 [&_svg]:size-10",
        "2xl": "size-28 text-[2.5rem] [&_svg]:size-14",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-[28%]",
      },
    },
    defaultVariants: { size: "md", shape: "circle" },
  },
);

type AvatarVariants = VariantProps<typeof avatarVariants>;
type Status = "online" | "away" | "busy" | "offline";

const STATUS_CLASS: Record<Status, string> = {
  online: "bg-success-vivid",
  away: "bg-warning-ink",
  busy: "bg-danger-ink",
  offline: "bg-fg-subtle",
};

// How much each avatar in a group tucks under the previous one (about a quarter of its size).
const GROUP_OVERLAP: Record<NonNullable<AvatarVariants["size"]>, string> = {
  xs: "-space-x-1.5",
  sm: "-space-x-2",
  md: "-space-x-2.5",
  lg: "-space-x-3.5",
  xl: "-space-x-5",
  "2xl": "-space-x-7",
};

const GroupContext = createContext<AvatarVariants | null>(null);

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = [...words[0]][0] ?? "";
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

// A stable hue per name (FNV-1a), so the same person always gets the same color.
export function nameHue(name: string) {
  let hash = 2166136261;
  for (const ch of name) hash = Math.imul(hash ^ ch.codePointAt(0)!, 16777619) >>> 0;
  return hash % 360;
}

function fallbackBackground(name?: string, color?: string): CSSProperties {
  if (color) {
    return { backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${color} 80%, white), ${color})` };
  }
  if (!name) return { backgroundImage: "linear-gradient(180deg, var(--pl-fg-subtle), var(--pl-fg-muted))" };
  const h = nameHue(name);
  return { backgroundImage: `linear-gradient(180deg, oklch(0.68 0.12 ${h}), oklch(0.52 0.14 ${h}))` };
}

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> &
  AvatarVariants & {
    src?: string;
    /** Used for initials, the fallback color and the accessible name. */
    name?: string;
    alt?: string;
    /** Base color for the fallback (any CSS color, e.g. "var(--pl-accent)"). */
    color?: string;
    /** Shown instead of initials when there is no photo. */
    icon?: ReactNode;
    status?: Status;
    statusLabel?: string;
  };

export function Avatar({
  className,
  size,
  shape,
  src,
  name,
  alt,
  color,
  icon,
  status,
  statusLabel,
  style,
  ...props
}: AvatarProps) {
  const group = useContext(GroupContext);
  const resolvedSize = size ?? group?.size;
  const resolvedShape = shape ?? group?.shape;
  const label = alt ?? name;
  return (
    <span
      role={label && !src ? "img" : undefined}
      aria-label={label && !src ? label : undefined}
      className={cn(avatarVariants({ size: resolvedSize, shape: resolvedShape }), className)}
      style={style}
      {...props}
    >
      <AvatarPrimitive.Root className="block size-full overflow-hidden rounded-[inherit]">
        {src && <AvatarPrimitive.Image src={src} alt={label ?? ""} className="size-full object-cover" />}
        <AvatarPrimitive.Fallback
          delayMs={src ? 400 : 0}
          className="flex size-full items-center justify-center leading-none"
          style={fallbackBackground(name, color)}
          aria-hidden="true"
        >
          {icon ?? (name ? initials(name) : null)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          role="status"
          aria-label={statusLabel ?? status}
          className={cn(
            "absolute end-0 bottom-0 size-[28%] min-h-2 min-w-2 rounded-full ring-2 ring-bg",
            resolvedShape === "rounded" && "end-[-4%] bottom-[-4%]",
            STATUS_CLASS[status],
          )}
        />
      )}
    </span>
  );
}

export type AvatarGroupProps = HTMLAttributes<HTMLDivElement> &
  AvatarVariants & {
    /** How many avatars to show before "+N". */
    max?: number;
    children: ReactNode;
  };

export function AvatarGroup({ className, size, shape, max, children, ...props }: AvatarGroupProps) {
  const items = Children.toArray(children);
  const shown = max ? items.slice(0, max) : items;
  const rest = items.length - shown.length;
  return (
    <GroupContext.Provider value={{ size, shape }}>
      <div className={cn("flex items-center *:ring-2 *:ring-bg", GROUP_OVERLAP[size ?? "md"], className)} {...props}>
        {shown}
        {rest > 0 && (
          <span
            className={cn(avatarVariants({ size, shape }), "bg-fill text-fg-muted")}
            aria-label={`${rest} more`}
            role="img"
          >
            +{rest}
          </span>
        )}
      </div>
    </GroupContext.Provider>
  );
}
