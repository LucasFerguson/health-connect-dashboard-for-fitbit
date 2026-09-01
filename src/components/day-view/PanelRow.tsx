import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { SectionFooter } from "~/components/ui/SectionFooter";
import { SectionHeader } from "~/components/ui/SectionHeader";
import {
  absenceReason,
  isDisplayableStatus,
} from "~/domain/dayViewPresentation";
import type { HealthDay } from "~/server/health/dayAnalyticsSchema";

const ZONE_COLORS = [
  "var(--color-sleep)",
  "var(--color-recovery)",
  "var(--color-caution)",
  "var(--color-strain)",
  "var(--color-alert)",
];

/**
 * TIME IN ZONE — needs personal HR zone thresholds (`heartRateZones`) plus
 * cumulative per-zone minutes for the day. The contract only carries the
 * calibrated thresholds and one rolled-up `zone3AndAbove` minutes figure
 * (no full per-zone minute breakdown), so this renders the real thresholds
 * when calibrated and the one real minutes figure this account has, and
 * otherwise the placeholder/absent state using the API's own note
 * (requirement #10) — never the old hardcoded "Z5 175+"-style boundaries.
 */
function TimeInZonePanel({ day }: { day: HealthDay }) {
  const { heartRateZones, supportingMetrics } = day;
  const zonesAvailable =
    isDisplayableStatus(heartRateZones.status) &&
    Array.isArray(heartRateZones.value) &&
    heartRateZones.value.length > 0;

  if (!zonesAvailable) {
    return (
      <Card className="flex flex-col">
        <SectionHeader title="TIME IN ZONE" right="SO FAR TODAY" />
        <EmptyState
          message={absenceReason(heartRateZones.status, heartRateZones.note)}
        />
        <SectionFooter bordered>NO ZONE THRESHOLDS CONFIGURED</SectionFooter>
      </Card>
    );
  }

  const thresholds = heartRateZones.value!;
  const zoneRows = thresholds
    .map((threshold, index) => ({
      label: `Z${index + 1} ${Math.round(threshold)}+`,
      color: ZONE_COLORS[index % ZONE_COLORS.length]!,
    }))
    .reverse();

  const zone3Plus = supportingMetrics.zone3AndAbove;
  const zone3PlusDisplay =
    isDisplayableStatus(zone3Plus.status) && typeof zone3Plus.value === "number"
      ? `${Math.round(zone3Plus.value)} MIN`
      : "—";

  return (
    <Card className="flex flex-col">
      <SectionHeader title="TIME IN ZONE" right="SO FAR TODAY" />
      <div className="flex flex-1 flex-col justify-center gap-[5px]">
        {zoneRows.map((zone) => (
          <div key={zone.label} className="flex items-center gap-2.5">
            <span
              className="w-11 font-mono text-[8.5px]"
              style={{ color: zone.color }}
            >
              {zone.label}
            </span>
            <div className="bg-ink-850 h-2.5 flex-1" />
            <span className="text-ink-200 w-[34px] text-right font-mono text-[9.5px] font-medium">
              —
            </span>
          </div>
        ))}
      </div>
      <SectionFooter bordered>ZONE 3+ TODAY: {zone3PlusDisplay}</SectionFooter>
    </Card>
  );
}

/**
 * REST OF DAY — needs plan-block data, which the backend doesn't provide
 * (`timeline.schedule` is `not_implemented`). Renders the API's own note.
 */
function RestOfDayPanel({ day }: { day: HealthDay }) {
  return (
    <Card className="flex flex-col">
      <SectionHeader
        title="REST OF DAY"
        right="PLANNED"
        rightColor="var(--color-brand-500)"
      />
      <EmptyState
        message={absenceReason(
          day.timeline.schedule.status,
          day.timeline.schedule.note,
        )}
      />
      <SectionFooter bordered>
        DRAG A BLOCK ON THE TIMELINE TO RESCHEDULE
      </SectionFooter>
    </Card>
  );
}

/**
 * SIGNALS — needs a rolling-baseline insight-generation pipeline, which
 * doesn't exist in this contract. Uses the day's own availability notes
 * when there's a specific one to surface, otherwise a generic empty state.
 */
function SignalsPanel({ day }: { day: HealthDay }) {
  const firstNote = day.availabilityNotes[0];
  return (
    <Card className="flex flex-col gap-2">
      <span className="font-display text-[15px] tracking-[.12em]">SIGNALS</span>
      <div className="text-ink-200 font-prose flex flex-1 items-center text-[10px]">
        {firstNote?.note ?? "No signals yet — insight generation isn't built."}
      </div>
    </Card>
  );
}

export function PanelRow({ day }: { day: HealthDay }) {
  return (
    <div className="grid h-[158px] shrink-0 grid-cols-3 gap-3">
      <TimeInZonePanel day={day} />
      <RestOfDayPanel day={day} />
      <SignalsPanel day={day} />
    </div>
  );
}
