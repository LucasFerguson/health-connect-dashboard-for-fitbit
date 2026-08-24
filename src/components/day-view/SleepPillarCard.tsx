import { Card } from "~/components/ui/Card";
import { SegmentedBar } from "~/components/ui/SegmentedBar";
import { StatValue } from "~/components/ui/StatValue";
import { formatClock } from "~/domain/dayViewTime";

export interface SleepPillarData {
  totalMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  windowStartIso: string | null;
  windowEndIso: string | null;
}

function formatHm(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.round(Math.abs(minutes));
  return `${sign}${Math.floor(abs / 60)}:${(abs % 60).toString().padStart(2, "0")}`;
}

/**
 * SLEEP pillar card, built from real sleep-session stage data for the
 * selected date. There's no modeled "sleep need" in this app yet, so the
 * qualifier reads the recorded window instead of a % of a computed target.
 */
export function SleepPillarCard({
  data,
  timeZone,
}: {
  data: SleepPillarData | null;
  timeZone: string;
}) {
  if (!data || data.totalMinutes === 0) {
    return (
      <Card topAccent="var(--color-sleep)">
        <PillarHeader
          label="SLEEP"
          hue="var(--color-sleep)"
          qualifier="NO DATA"
        />
        <StatValue value="—" context="No sleep recorded" className="my-[7px]" />
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

  const { deepMinutes, remMinutes, lightMinutes, awakeMinutes } = data;
  const window =
    data.windowStartIso && data.windowEndIso
      ? `${formatClock(data.windowStartIso, timeZone)} → ${formatClock(data.windowEndIso, timeZone)}`
      : null;

  return (
    <Card topAccent="var(--color-sleep)">
      <PillarHeader
        label="SLEEP"
        hue="var(--color-sleep)"
        qualifier="RECORDED"
      />
      <StatValue
        value={formatHm(data.totalMinutes)}
        context={window ?? undefined}
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
