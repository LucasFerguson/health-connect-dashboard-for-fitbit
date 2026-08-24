import { Card } from "~/components/ui/Card";
import { SegmentedBar } from "~/components/ui/SegmentedBar";
import { StatValue } from "~/components/ui/StatValue";
import { formatClock } from "~/domain/dayViewTime";
import {
  absenceReason,
  isDisplayableStatus,
} from "~/domain/dayViewPresentation";
import type {
  SleepDurationMetric,
  SleepNeedMetric,
} from "~/server/health/dayAnalyticsSchema";

function formatHm(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.round(Math.abs(minutes));
  return `${sign}${Math.floor(abs / 60)}:${(abs % 60).toString().padStart(2, "0")}`;
}

/**
 * SLEEP pillar card, built from `headlineScores.sleepDuration` (window,
 * stage totals) and `headlineScores.sleepNeed` (fixed-target percentage)
 * per requirement #7. Renders the honest "no data" shell whenever
 * `sleepDuration.status` isn't displayable, using the API's own note rather
 * than a hardcoded string.
 */
export function SleepPillarCard({
  sleepDuration,
  sleepNeed,
  timeZone,
}: {
  sleepDuration: SleepDurationMetric;
  sleepNeed: SleepNeedMetric;
  timeZone: string;
}) {
  if (
    !isDisplayableStatus(sleepDuration.status) ||
    sleepDuration.value === null
  ) {
    return (
      <Card topAccent="var(--color-sleep)">
        <PillarHeader
          label="SLEEP"
          hue="var(--color-sleep)"
          qualifier="NO DATA"
        />
        <StatValue
          value="—"
          context={absenceReason(sleepDuration.status, sleepDuration.note)}
          className="my-[7px]"
        />
        <SegmentedBar segments={[{ flex: 1, color: "var(--color-ink-500)" }]} />
        <PillarFooter
          items={[
            ["DEEP", "—"],
            ["REM", "—"],
            ["LGT", "—"],
            ["AWK", "—"],
          ]}
        />
      </Card>
    );
  }

  const stages = sleepDuration.stageMinutes;
  const deepMinutes = stages?.deep ?? 0;
  const remMinutes = stages?.rem ?? 0;
  const lightMinutes = stages?.light ?? 0;
  const awakeMinutes = stages?.awake ?? 0;

  const window = sleepDuration.window
    ? `${formatClock(sleepDuration.window.startAt, timeZone)} → ${formatClock(sleepDuration.window.endAt, timeZone)}`
    : undefined;

  const sleepNeedDisplay =
    isDisplayableStatus(sleepNeed.status) && sleepNeed.value !== null
      ? `${Math.round(sleepNeed.value)}% OF NEED`
      : undefined;

  return (
    <Card topAccent="var(--color-sleep)">
      <PillarHeader
        label="SLEEP"
        hue="var(--color-sleep)"
        qualifier="RECORDED"
      />
      <StatValue
        value={formatHm(sleepDuration.value)}
        delta={sleepNeedDisplay}
        deltaTone={sleepNeedDisplay ? "neutral" : undefined}
        context={window}
        className="my-[7px]"
      />
      <SegmentedBar
        segments={[
          { flex: Math.max(deepMinutes, 0.01), color: "var(--color-sleep)" },
          {
            flex: Math.max(remMinutes, 0.01),
            color: "var(--color-sleep-light)",
          },
          {
            flex: Math.max(lightMinutes, 0.01),
            color: "var(--color-sleep-deep)",
          },
          { flex: Math.max(awakeMinutes, 0.01), color: "var(--color-ink-500)" },
        ]}
      />
      <PillarFooter
        items={[
          ["DEEP", formatHm(deepMinutes)],
          ["REM", formatHm(remMinutes)],
          ["LGT", formatHm(lightMinutes)],
          ["AWK", formatHm(awakeMinutes)],
        ]}
      />
    </Card>
  );
}

export function PillarHeader({
  label,
  hue,
  qualifier,
}: {
  label: string;
  hue: string;
  qualifier: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span
        className="font-display text-[16px] tracking-[.12em]"
        style={{ color: hue }}
      >
        {label}
      </span>
      <span className="text-ink-200 font-mono text-[9px] tracking-[.08em]">
        {qualifier}
      </span>
    </div>
  );
}

export function PillarFooter({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="text-ink-200 mt-1.5 flex justify-between font-mono text-[8.5px]">
      {items.map(([label, value]) => (
        <span key={label}>
          {label} {value}
        </span>
      ))}
    </div>
  );
}
