import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface StatValueProps {
  /** The big numeral, e.g. "7:42", "82", "6.4". */
  value: ReactNode;
  /** Optional small unit/suffix rendered beside the value at a lighter
   * weight, e.g. the "%" in the RECOVERY pillar card (16px 400, dim). */
  unit?: ReactNode;
  /** Optional delta chip, e.g. "+0:34" or "46% OF PLAN". */
  delta?: ReactNode;
  /** Tone of the delta text. "good" is the recovery green, "neutral" is
   * dim ink, "custom" leaves styling entirely to deltaClassName. */
  deltaTone?: "good" | "neutral" | "custom";
  /** Extra classes for the delta element, for one-off tones/positioning. */
  deltaClassName?: string;
  /** Right-aligned context text, e.g. "00:04 → 07:04" or "14D AVG 71". */
  context?: ReactNode;
  className?: string;
}

const deltaToneClasses: Record<"good" | "neutral", string> = {
  good: "text-recovery",
  neutral: "text-ink-200",
};

/**
 * The pillar-card value row: a big JetBrains Mono numeral, an optional unit
 * suffix, an optional delta chip, and right-aligned context — all on one
 * baseline-aligned row.
 */
export function StatValue({
  value,
  unit,
  delta,
  deltaTone = "neutral",
  deltaClassName,
  context,
  className,
}: StatValueProps) {
  return (
    <div className={clsx("flex items-baseline gap-2", className)}>
      <span className="text-ink-0 font-mono text-[34px] leading-none font-bold tracking-[-.03em]">
        {value}
      </span>
      {unit ? (
        <span className="text-ink-200 font-mono text-base font-normal">
          {unit}
        </span>
      ) : null}
      {delta ? (
        <span
          className={clsx(
            "font-mono text-[11px] font-medium",
            deltaTone !== "custom" && deltaToneClasses[deltaTone],
            deltaClassName,
          )}
        >
          {delta}
        </span>
      ) : null}
      {context ? (
        <span className="text-ink-200 ml-auto font-mono text-[9px]">
          {context}
        </span>
      ) : null}
    </div>
  );
}
