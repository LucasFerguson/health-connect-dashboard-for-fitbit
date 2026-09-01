import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export interface LabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  className?: string;
}

/**
 * The dim mono caption pattern repeated throughout the day view (context-bar
 * captions like "RANGE"/"LOCKED ON DAY", the timeline's axis labels, and
 * formerly the pillar-card header qualifier before `SectionHeader` absorbed
 * that one specific case): `text-ink-200`, JetBrains Mono, 9px, tracked out.
 *
 * Kept as a component rather than a Tailwind `@utility` — call sites vary
 * slightly in tracking (`.08em` vs `.14em`) and occasionally override color
 * for state (e.g. the FUTURE/PLANNED tag using brand purple instead), which
 * reads more clearly as `className` overrides on a component than as
 * multiple near-duplicate `@utility` variants in globals.css.
 */
export function Label({ children, className, ...rest }: LabelProps) {
  return (
    <span
      className={clsx(
        "text-ink-200 font-mono text-[9px] tracking-[.08em]",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
