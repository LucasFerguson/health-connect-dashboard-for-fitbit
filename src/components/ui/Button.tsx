import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { tv } from "tailwind-variants";
import { notchStyle } from "./notch";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** "primary" is the filled brand-purple action button; "secondary" is
   * outlined, matching the border-ink-500 chrome used elsewhere (Card,
   * DropdownTrigger). Defaults to "primary". */
  variant?: "primary" | "secondary";
  /** Standalone page-action sizing — deliberately roomier than the 24px
   * day-view chrome (IconButton, DropdownTrigger), since this is meant for
   * general pages, not the tight context-bar/pillar-card density. Defaults
   * to "md". */
  size?: "sm" | "md";
  /** Notch size in px. Defaults to 10 — sized for this button's larger
   * standalone footprint (bigger than the 6-8px notches on chips/dropdowns,
   * smaller than the 15-16px card notches). */
  notchSize?: number;
  className?: string;
}

const button = tv({
  base: "inline-flex items-center justify-center gap-1.5 font-mono tracking-[.06em] transition-colors duration-[120ms] ease-out disabled:pointer-events-none disabled:opacity-45",
  variants: {
    variant: {
      primary:
        "bg-brand-500 text-ink-0 hover:bg-brand-400 border border-transparent",
      secondary:
        "border-ink-500 text-ink-100 hover:border-ink-400 hover:bg-ink-800 hover:text-ink-0 border bg-transparent",
    },
    size: {
      sm: "h-8 px-[14px] text-[10.5px]",
      md: "h-10 px-[20px] text-[11.5px]",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

/**
 * The primary/secondary action button for standalone page use (e.g. a page
 * header's call-to-action) — the design system had a static tag (`Chip`)
 * and a trigger-only control (`DropdownTrigger`) but nothing pressable for
 * a real action, so this fills that gap. Uses the notch motif via `style`
 * (like `Card`/`Chip`/`DropdownTrigger`) so it reads as part of the same
 * family, and `tailwind-variants` for the variant/size matrix per this
 * project's component-variant convention.
 */
export function Button({
  children,
  variant,
  size,
  notchSize = 10,
  className,
  style,
  ...rest
}: ButtonProps) {
  const mergedStyle: CSSProperties = { ...notchStyle(notchSize), ...style };

  return (
    <button
      type="button"
      className={button({ variant, size, className })}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </button>
  );
}
