import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import type { MetricDefinition } from "~/domain/exploreMetrics";

/** "+0.42", "−0.10", "—". */
export function formatR(value: number | null) {
  if (value === null) return "—";
  const text = Math.abs(value).toFixed(2);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

/** "sleep duration", "sleep duration the next day", "… 3 days earlier". */
export function yPhrase(y: MetricDefinition, lag: number) {
  const label = y.kind === "binary" ? `“${y.label}”` : y.label.toLowerCase();
  if (lag === 0) return label;
  if (lag === 1) return `${label} the next day`;
  if (lag === -1) return `${label} the day before`;
  return `${label} ${Math.abs(lag)} days ${lag > 0 ? "later" : "earlier"}`;
}

/** A compact stat tile: caption, value, and a caption line underneath, so
 * the secondary text never squeezes the value at phone width. */
export function Stat({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption?: string;
  accent?: string;
}) {
  return (
    <Card topAccent={accent} className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      <span className="text-ink-0 font-mono text-[22px] leading-none font-bold tracking-[-.03em] sm:text-[30px]">
        {value}
      </span>
      <Label className="text-ink-100 min-h-[11px]">{caption ?? ""}</Label>
    </Card>
  );
}
