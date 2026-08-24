import type { ReactNode } from "react";
import { Card } from "~/components/ui/Card";

const ZONE_ROWS = [
  { label: "Z5 175+", color: "var(--color-alert)" },
  { label: "Z4 155", color: "var(--color-strain)" },
  { label: "Z3 135", color: "var(--color-caution)" },
  { label: "Z2 115", color: "var(--color-recovery)" },
  { label: "Z1 95", color: "var(--color-sleep)" },
];

function PanelHeader({
  title,
  right,
  rightColor,
}: {
  title: string;
  right: string;
  rightColor?: string;
}) {
  return (
    <div className="mb-[9px] flex items-baseline gap-2.5">
      <span className="font-display text-[15px] tracking-[.12em]">{title}</span>
      <span
        className="text-ink-200 ml-auto font-mono text-[8.5px]"
        style={rightColor ? { color: rightColor } : undefined}
      >
        {right}
      </span>
    </div>
  );
}

function PanelFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-ink-500 text-ink-200 mt-2 border-t pt-[7px] font-mono text-[8.5px]">
      {children}
    </div>
  );
}

/**
 * TIME IN ZONE — needs personal HR zone thresholds (from an LT2 test) and
 * cumulative zone minutes for the day. Neither exists in this app, so
 * every row renders at 0 with an explanatory footer instead of the
 * "ZONES FROM LT2 TEST" provenance line the design specifies (there is no
 * test date to show).
 */
function TimeInZonePanel() {
  return (
    <Card className="flex flex-col">
      <PanelHeader title="TIME IN ZONE" right="SO FAR TODAY" />
      <div className="flex flex-1 flex-col justify-center gap-[5px]">
        {ZONE_ROWS.map((zone) => (
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
      <PanelFooter>NO ZONE THRESHOLDS CONFIGURED YET</PanelFooter>
    </Card>
  );
}

/**
 * REST OF DAY — needs plan-block data, which doesn't exist (see PlanLane).
 * Renders an explanatory empty state instead of the four scheduled-item
 * rows in the mock.
 */
function RestOfDayPanel() {
  return (
    <Card className="flex flex-col">
      <PanelHeader
        title="REST OF DAY"
        right="PLANNED"
        rightColor="var(--color-brand-500)"
      />
      <div className="text-ink-200 flex flex-1 items-center justify-center px-2 text-center font-mono text-[9px] tracking-[.02em]">
        No schedule source connected yet.
      </div>
      <PanelFooter>DRAG A BLOCK ON THE TIMELINE TO RESCHEDULE</PanelFooter>
    </Card>
  );
}

/**
 * SIGNALS — needs a rolling-baseline insight-generation pipeline, which
 * doesn't exist. Renders the spec's 0-state rather than fabricated
 * insights.
 */
function SignalsPanel() {
  return (
    <Card className="flex flex-col gap-2">
      <span className="font-display text-[15px] tracking-[.12em]">SIGNALS</span>
      <div className="text-ink-200 font-prose flex flex-1 items-center text-[10px]">
        No signals yet — insight generation isn&apos;t built.
      </div>
    </Card>
  );
}

export function PanelRow() {
  return (
    <div className="grid h-[158px] shrink-0 grid-cols-3 gap-3">
      <TimeInZonePanel />
      <RestOfDayPanel />
      <SignalsPanel />
    </div>
  );
}
