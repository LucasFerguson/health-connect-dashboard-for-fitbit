import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface EmptyStateProps {
  /** The explanation text, e.g. an `absenceReason(...)` result. */
  message: ReactNode;
  /** "flex" (default) centers within a flex-1 parent, filling the
   * remaining space of a card body — the panel-row shape. "block" just
   * centers its own text without claiming flex space, for standalone use
   * outside a flex column. */
  variant?: "flex" | "block";
  className?: string;
}

/**
 * The centered dim-mono "no data" message duplicated at both PanelRow.tsx
 * call sites (TIME IN ZONE, REST OF DAY): a small, tracked-out caption
 * explaining why a panel has nothing to show, using the API's own note
 * rather than a hardcoded string.
 */
export function EmptyState({
  message,
  variant = "flex",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "text-ink-200 text-center font-mono text-[9px] tracking-[.02em]",
        variant === "flex"
          ? "flex flex-1 items-center justify-center px-2"
          : "px-2",
        className,
      )}
    >
      {message}
    </div>
  );
}
