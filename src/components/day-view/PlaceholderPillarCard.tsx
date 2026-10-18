import { Card } from "~/components/ui/Card";
import { SectionFooter } from "~/components/ui/SectionFooter";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { Track, type TrackZone } from "~/components/ui/Track";
import { StatValue } from "~/components/ui/StatValue";
import {
  PILLAR_FOOTER_CLASS,
  PILLAR_HEADER_CLASS,
  PILLAR_STAT_CLASS,
} from "./phoneText";
import {
  absenceReason,
  isDisplayableStatus,
} from "~/domain/dayViewPresentation";
import type { MetricStatus } from "~/domain/dayView";

/**
 * Shared shell for the RECOVERY and STRAIN pillar cards. Renders the
 * absent/placeholder state (em-dash value, the API's own `note` as the
 * explanation) whenever there's no displayable `value`. When one is
 * supplied it renders as a real stat on its own scale (`scaleMax`): RECOVERY
 * as a provisional 0-100 score, STRAIN as an experimental cardiovascular
 * estimate, never "WHOOP Strain" or implying WHOOP parity, per the
 * migration spec.
 */
export function PlaceholderPillarCard({
  label,
  hue,
  footer,
  status,
  note,
  value,
  qualifier,
  scaleMax = 21,
  formatValue = (number) => number.toFixed(1),
  hueForValue,
  zones,
}: {
  label: string;
  hue: string;
  /** Supporting-metric label/value pairs, already formatted (em-dash for a
   * missing value; see `supportingMetricDisplay`). */
  footer: Array<[string, string]>;
  status: MetricStatus;
  note?: string | null;
  /** A real numeric value to render instead of the placeholder shell; only
   * used when `status` is displayable (`available` or `partial`). */
  value?: number | null;
  /** Overrides the header qualifier text (e.g. "EXPERIMENTAL ESTIMATE")
   * when rendering a real value. */
  qualifier?: string;
  /** The top of the value's scale, for the track fill (21 for strain). */
  scaleMax?: number;
  formatValue?: (value: number) => string;
  /** Recolors the card (accent, title, fill) by the value, e.g. a recovery
   * zone; `hue` is used when there's no value. */
  hueForValue?: (value: number) => string;
  /** Zones marked along the bar, in percent of the scale. */
  zones?: TrackZone[];
}) {
  if (
    isDisplayableStatus(status) &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(value)
  ) {
    const valueHue = hueForValue?.(value) ?? hue;
    return (
      <Card topAccent={valueHue}>
        <SectionHeader
          title={label}
          titleColor={valueHue}
          right={qualifier ?? "ESTIMATE"}
          size="md"
          className={PILLAR_HEADER_CLASS}
        />
        <StatValue value={formatValue(value)} className={PILLAR_STAT_CLASS} />
        <Track
          fillPercent={Math.min(100, Math.max(0, (value / scaleMax) * 100))}
          fillColor={valueHue}
          heightPx={7}
          zones={zones}
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
      <Track fillPercent={0} fillColor={hue} heightPx={7} zones={zones} />
      <SectionFooter className={PILLAR_FOOTER_CLASS} items={footer} />
    </Card>
  );
}
