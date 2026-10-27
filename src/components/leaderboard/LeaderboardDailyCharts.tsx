"use client";

import { LazyECharts as ReactECharts } from "~/components/ui/LazyECharts";
import { Card } from "~/components/ui/Card";
import {
  formatMinutes,
  type LeaderboardDay,
  type LeaderboardMember,
  type LeaderboardMemberDaily,
} from "~/domain/leaderboard";

const AXIS_TEXT = "#9a93ab";
const GRID_LINE = "rgba(239, 236, 245, 0.06)";
/** Recovery zone bands, matching `--color-alert/caution/recovery`. */
const ZONES = [
  { from: 0, to: 34, color: "rgba(255, 107, 122, 0.08)" },
  { from: 34, to: 67, color: "rgba(217, 193, 58, 0.08)" },
  { from: 67, to: 100, color: "rgba(79, 201, 138, 0.08)" },
];

interface ChartSpec {
  title: string;
  field: keyof Omit<LeaderboardDay, "date" | "recoveryBand">;
  kind: "bar" | "line";
  format: (value: number) => string;
  /** Converts the stored value for the axis (e.g. minutes -> hours). */
  scale?: (value: number) => number;
  yMax?: number;
  zones?: boolean;
}

const CHARTS: ChartSpec[] = [
  {
    title: "Sleep per night",
    field: "sleepMinutes",
    kind: "bar",
    format: formatMinutes,
    scale: (minutes) => Math.round((minutes / 60) * 10) / 10,
  },
  {
    title: "Recovery",
    field: "recoveryScore",
    kind: "line",
    format: (score) => String(Math.round(score)),
    yMax: 100,
    zones: true,
  },
  {
    title: "Steps per day",
    field: "steps",
    kind: "bar",
    format: (steps) => Math.round(steps).toLocaleString("en-US"),
  },
];

/**
 * The side-by-side summary: each member's sleep, recovery and steps per
 * date over the selected window, one series per member in their color.
 * Missing days are gaps (null), never zero-height bars.
 */
export function LeaderboardDailyCharts({
  members,
  daily,
  days,
  colorOf,
}: {
  members: LeaderboardMember[];
  daily: LeaderboardMemberDaily[];
  days: number;
  colorOf: (userId: string) => string;
}) {
  const dates = [
    ...new Set(daily.flatMap((member) => member.days.map((day) => day.date))),
  ]
    .sort()
    .slice(-days);
  const byMember = new Map(
    daily.map((member) => [
      member.userId,
      new Map(member.days.map((day) => [day.date, day])),
    ]),
  );

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl tracking-[.12em]">SIDE BY SIDE</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {CHARTS.map((spec) => (
          <div key={spec.field} className="flex flex-col gap-1">
            <span className="text-ink-100 text-sm">{spec.title}</span>
            <div className="h-48" role="img" aria-label={spec.title}>
              <ReactECharts
                option={chartOption(spec, dates, members, byMember, colorOf)}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function chartOption(
  spec: ChartSpec,
  dates: string[],
  members: LeaderboardMember[],
  byMember: Map<string, Map<string, LeaderboardDay>>,
  colorOf: (userId: string) => string,
) {
  const scale = spec.scale ?? ((value: number) => value);
  return {
    animation: false,
    grid: { top: 12, right: 8, bottom: 24, left: 40 },
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: (
        params: Array<{ seriesName: string; dataIndex: number; color: string }>,
      ) => {
        const date = dates[params[0]?.dataIndex ?? 0] ?? "";
        const lines = members.map((member) => {
          const value = byMember.get(member.userId)?.get(date)?.[spec.field];
          const shown =
            value === null || value === undefined ? "—" : spec.format(value);
          return `<span style="color:${colorOf(member.userId)}">■</span> ${member.displayName}: ${shown}`;
        });
        return [date, ...lines].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: dates.map((date) => date.slice(5)),
      axisLabel: { color: AXIS_TEXT, hideOverlap: true, fontSize: 10 },
      axisLine: { lineStyle: { color: "#302842" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: spec.yMax,
      axisLabel: { color: AXIS_TEXT, fontSize: 10 },
      splitLine: { lineStyle: { color: GRID_LINE } },
    },
    series: members.map((member, index) => ({
      name: member.displayName,
      type: spec.kind,
      data: dates.map((date) => {
        const value = byMember.get(member.userId)?.get(date)?.[spec.field];
        return value === null || value === undefined ? null : scale(value);
      }),
      itemStyle: { color: colorOf(member.userId) },
      lineStyle: { color: colorOf(member.userId), width: 2 },
      connectNulls: false,
      symbolSize: 6,
      barGap: "10%",
      ...(spec.zones && index === 0
        ? {
            markArea: {
              silent: true,
              data: ZONES.map((zone) => [
                { yAxis: zone.from, itemStyle: { color: zone.color } },
                { yAxis: zone.to },
              ]),
            },
          }
        : {}),
    })),
  };
}
