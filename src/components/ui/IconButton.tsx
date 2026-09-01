import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

/**
 * A 24×24 bordered-square icon button — the prev/next-day chrome from the
 * context bar's date stepper, generalized for reuse. Deliberately square
 * (no notch) since it's meant to butt flush against the date-strip block
 * it steps, unlike the notched Card/Chip/DropdownTrigger family.
 */
export function IconButton({
  children,
  className,
  disabled,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        "border-ink-500 text-ink-100 hover:bg-ink-800 hover:text-ink-0 flex size-6 items-center justify-center border font-mono text-[11px] transition-colors duration-[120ms] ease-out disabled:pointer-events-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
