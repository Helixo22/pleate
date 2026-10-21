// Navbar: the site header. Brand, links and actions on desktop; on phones the links move into a full-width panel
// opened by an animated menu button (the two lines fold into an ×). Solid background; a hairline appears once the
// page scrolls, and with hideOnScroll the bar slides away while reading and comes back on the way up.
// Links are rendered in both places, so pass plain NavbarLink children (asChild works with Next <Link>).
"use client";

import { AnimatePresence, motion } from "motion/react";
import { Slot } from "radix-ui";
import { createContext, useContext, useEffect, useId, useState, type AnchorHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { useIsDesktop } from "../../lib/use-media-query.ts";
import { useScrollDirection, useScrolled } from "../../lib/use-scroll.ts";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Container, type ContainerProps } from "../container/container.tsx";

type Placement = "bar" | "panel";
const NavbarContext = createContext<{ placement: Placement; close: () => void }>({ placement: "bar", close: () => {} });

export type NavbarProps = {
  brand?: ReactNode;
  /** Buttons at the end of the bar (also visible on phones, before the menu button). */
  actions?: ReactNode;
  /** NavbarLink elements. */
  children?: ReactNode;
  /** Extra content at the bottom of the phone menu (e.g. a full-width call to action). */
  panelFooter?: ReactNode;
  sticky?: boolean;
  hideOnScroll?: boolean;
  size?: ContainerProps["size"];
  menuLabel?: string;
  navLabel?: string;
  className?: string;
};

function MenuIcon({ open }: { open: boolean }) {
  const line = "absolute start-1/2 h-[1.5px] w-[1.0625rem] -translate-x-1/2 rounded-full bg-current transition-[top,rotate] duration-(--pl-duration-base) ease-ios";
  return (
    <span aria-hidden="true" className="relative block size-5">
      <span className={cn(line, open ? "top-[9.25px] rotate-45" : "top-[6px]")} />
      <span className={cn(line, open ? "top-[9.25px] -rotate-45" : "top-[12.5px]")} />
    </span>
  );
}

export function Navbar({
  brand,
  actions,
  children,
  panelFooter,
  sticky = true,
  hideOnScroll = false,
  size = "xl",
  menuLabel = "Menu",
  navLabel = "Main",
  className,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  const scrolled = useScrolled(4, sticky);
  const direction = useScrollDirection({ enabled: sticky && hideOnScroll });
  const panelId = useId();
  const hidden = hideOnScroll && direction === "down" && !open;

  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "z-(--pl-z-sticky) w-full bg-bg pt-(--pl-safe-top) text-fg",
        "shadow-[inset_0_-1px_0_transparent] transition-[translate,box-shadow] duration-(--pl-duration-slow) ease-ios",
        "data-scrolled:shadow-[inset_0_-1px_0_var(--pl-separator)]",
        sticky && "sticky top-0",
        hidden && "-translate-y-full",
        open && "shadow-none data-scrolled:shadow-none",
        className,
      )}
    >
      <Container size={size} className="flex h-14 items-center gap-6">
        {brand && <div className="flex shrink-0 items-center">{brand}</div>}
        {children && (
          <NavbarContext.Provider value={{ placement: "bar", close }}>
            <nav aria-label={navLabel} className="hidden min-w-0 items-center gap-1 md:flex">
              {children}
            </nav>
          </NavbarContext.Provider>
        )}
        <div className="ms-auto flex items-center gap-2">
          {actions}
          {(children || panelFooter) && (
            <button
              type="button"
              aria-label={menuLabel}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((v) => !v)}
              className="pl-focus-ring pl-touch -me-2 grid size-10 cursor-pointer place-items-center rounded-full text-fg md:hidden"
            >
              <MenuIcon open={open} />
            </button>
          )}
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+var(--pl-safe-top))] overflow-y-auto bg-bg md:hidden"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={reduced ? { duration: 0.12 } : spring.sheet}
          >
            <Container size={size} className="flex flex-col gap-8 pt-4 pb-[calc(2rem+var(--pl-safe-bottom))]">
              <NavbarContext.Provider value={{ placement: "panel", close }}>
                <nav aria-label={navLabel} className="flex flex-col">
                  {children}
                </nav>
              </NavbarContext.Provider>
              {panelFooter}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export type NavbarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  ref?: Ref<HTMLAnchorElement>;
  asChild?: boolean;
  active?: boolean;
};

export function NavbarLink({ className, asChild, active, onClick, ...props }: NavbarLinkProps) {
  const { placement, close } = useContext(NavbarContext);
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      aria-current={active ? "page" : undefined}
      onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        close();
      }}
      className={cn(
        "pl-focus-ring pl-touch transition-colors duration-(--pl-duration-fast)",
        placement === "bar"
          ? "rounded-full px-3 py-1.5 text-subhead text-fg-muted hover:text-fg aria-[current=page]:text-fg aria-[current=page]:font-semibold"
          : "flex min-h-14 items-center border-b border-separator text-title2 text-fg aria-[current=page]:text-accent-ink",
        className,
      )}
      {...props}
    />
  );
}
