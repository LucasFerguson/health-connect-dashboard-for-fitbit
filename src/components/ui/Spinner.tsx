import { clsx } from "clsx";

export interface SpinnerProps {
  /** Square size in px. Defaults to 12 (inline, next to text/labels). */
  size?: number;
  /** Stroke color. Defaults to the dim secondary text tone. */
  color?: string;
  className?: string;
}

/**
 * A minimal rotating-arc spinner, sized for inline use next to labels and
 * buttons. Kept a plain stroked square-ish arc (no rounded pill chrome) so
 * it sits quietly inside the notched, hard-edged chrome rather than
 * introducing a foreign shape into it.
 */
export function Spinner({
  size = 12,
  color = "var(--color-ink-100)",
  className,
}: SpinnerProps) {
  return (
    <svg
      className={clsx("animate-spin", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
