import { Card } from "~/components/ui/Card";
import { SectionFooter } from "~/components/ui/SectionFooter";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { Track } from "~/components/ui/Track";
import { StatValue } from "~/components/ui/StatValue";
import {
  PILLAR_FOOTER_CLASS,
  PILLAR_HEADER_CLASS,
  PILLAR_STAT_CLASS,
} from "./phoneText";
import { absenceReason } from "~/domain/dayViewPresentation";
import type { MetricStatus } from "~/domain/dayView";

/**
 * Shared shell for the RECOVERY and STRAIN pillar cards. Renders the
 * absent/placeholder state (em-dash value, the API's own `note` as the
 * explanation) whenever `status` isn't `"available"` — RECOVERY is
 * currently always in this state on live data (per step 1's testing), but
 * this component doesn't hardcode that; it reads `status` generically so
 * it renders correctly the moment the backend starts returning a real
 * recovery score. When a `value` is supplied (STRAIN once available), it
 * renders as a real stat instead — labeled as an experimental
 * cardiovascular estimate, never "WHOOP Strain" or implying WHOOP parity,
 * per the migration spec.
 */
export function PlaceholderPillarCard({
  label,
  hue,
  footer,
  status,
  note,
  value,
  qualifier,
}: {
  label: string;
  hue: string;
  /** Supporting-metric label/value pairs, already formatted (em-dash for a
   * missing value; see `supportingMetricDisplay`). */
  footer: Array<[string, string]>;
  status: MetricStatus;
  note?: string | null;
  /** A real numeric value to render instead of the placeholder shell —
   * only pass this when `status === "available"`. */
  value?: number | null;
  /** Overrides the header qualifier text (e.g. "EXPERIMENTAL ESTIMATE")
   * when rendering a real value. */
  qualifier?: string;
}) {
  if (status === "available" && value !== null && value !== undefined) {
    return (
      <Card topAccent={hue}>
        <SectionHeader
          title={label}
          titleColor={hue}
          right={qualifier ?? "ESTIMATE"}
          size="md"
          className={PILLAR_HEADER_CLASS}
        />
        <StatValue value={value.toFixed(1)} className={PILLAR_STAT_CLASS} />
        <Track
          fillPercent={Math.min(100, (value / 21) * 100)}
          fillColor={hue}
          heightPx={7}
        />
        <SectionFooter className={PILLAR_FOOTER_CLASS} items={footer} />
      </Card>
    );
  }

  return (
    <Card topAccent={hue}>
      <SectionHeader
        title={label}
        titleColor={hue}
        right="NOT AVAILABLE"
        size="md"
        className={PILLAR_HEADER_CLASS}
      />
      <StatValue
        value="—"
        context={absenceReason(status, note)}
        className={PILLAR_STAT_CLASS}
      />
      <Track fillPercent={0} fillColor={hue} heightPx={7} />
      <SectionFooter className={PILLAR_FOOTER_CLASS} items={footer} />
    </Card>
  );
}
