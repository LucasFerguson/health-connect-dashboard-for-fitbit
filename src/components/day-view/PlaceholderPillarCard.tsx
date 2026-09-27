import { Card } from "~/components/ui/Card";
import { SectionFooter } from "~/components/ui/SectionFooter";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { Track } from "~/components/ui/Track";
import { StatValue } from "~/components/ui/StatValue";
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
  footerLabels,
  status,
  note,
  value,
  qualifier,
}: {
  label: string;
  hue: string;
  footerLabels: string[];
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
        />
        <StatValue value={value.toFixed(1)} className="my-[7px]" />
        <Track
          fillPercent={Math.min(100, (value / 21) * 100)}
          fillColor={hue}
          heightPx={7}
        />
        <SectionFooter
          items={footerLabels.map((item): [string, string] => [item, "—"])}
        />
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
      />
      <StatValue
        value="—"
        context={absenceReason(status, note)}
        className="my-[7px]"
      />
      <Track fillPercent={0} fillColor={hue} heightPx={7} />
      <SectionFooter
        items={footerLabels.map((item): [string, string] => [item, "—"])}
      />
    </Card>
  );
}
