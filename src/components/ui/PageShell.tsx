import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export interface PageShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Constrains and centers the inner content column. Defaults to the
   * `max-w-7xl` width used by both pages this replaces (Dashboard.tsx,
   * MetricDetailPage.tsx). Pass `false` to opt out and manage width
   * yourself (e.g. a page that wants full-bleed sections). */
  maxWidth?: string | false;
  className?: string;
}

/**
 * The full-page Meridian wrapper: `ink-900` background, primary `ink-0`
 * text, and a centered max-width content column with standard outer
 * padding. Replaces the ad hoc purple-gradient `<main>` wrapper duplicated
 * in Dashboard.tsx (`bg-gradient-to-b from-[#2e026d] to-[#15162c] ... text-white`)
 * and MetricDetailPage.tsx — those two pages haven't been migrated onto this
 * yet, but new/rewritten pages should start here.
 */
export function PageShell({
  children,
  maxWidth = "max-w-7xl",
  className,
  ...rest
}: PageShellProps) {
  return (
    <main
      className={clsx("bg-ink-900 text-ink-0 min-h-screen px-4 py-6", className)}
      {...rest}
    >
      <div className={clsx("mx-auto", maxWidth)}>{children}</div>
    </main>
  );
}
