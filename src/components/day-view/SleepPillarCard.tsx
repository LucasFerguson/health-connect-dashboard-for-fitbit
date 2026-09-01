import { Card } from "~/components/ui/Card";
import { SectionFooter } from "~/components/ui/SectionFooter";
import { SectionHeader } from "~/components/ui/SectionHeader";
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
        <SectionHeader
          title="SLEEP"
          titleColor="var(--color-sleep)"
          right="NO DATA"
          size="md"
        />
        <StatValue
          value="—"
          context={absenceReason(sleepDuration.status, sleepDuration.note)}
          className="my-[7px]"
        />
        <SegmentedBar segments={[{ flex: 1, color: "var(--color-ink-500)" }]} />
        <SectionFooter
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
      <SectionHeader
        title="SLEEP"
        titleColor="var(--color-sleep)"
        right="RECORDED"
        size="md"
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
      <SectionFooter
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
