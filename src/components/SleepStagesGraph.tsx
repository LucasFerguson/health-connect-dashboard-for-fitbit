"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { SleepStageKind } from "~/domain/health";
import { sleepMinutes } from "~/domain/sleep";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectSleepSessionsForDate } from "~/features/health/selectors";

const stageOrder: Record<SleepStageKind, number> = {
  awake: 0,
  rem: 1,
  light: 2,
  asleep: 2,
  deep: 3,
  unknown: 4,
};
const stageLabels = ["Awake", "REM", "Light", "Deep", "Unknown"];

export function SleepStagesGraph() {
  const { snapshot, selectedDate, selectedSleepSessionId, selectSleepSession } =
    useHealthData();
  const sessions = selectSleepSessionsForDate(snapshot, selectedDate);
  const selectedSession =
    sessions.find((session) => session.id === selectedSleepSessionId) ??
    sessions[0];
  const chartOptions = useMemo(() => {
    const points =
      selectedSession?.stages.flatMap((stage) => [
        [Date.parse(stage.startAt), stageOrder[stage.kind]],
        [Date.parse(stage.endAt), stageOrder[stage.kind]],
      ]) ?? [];
    return {
      backgroundColor: "#ffffff",
      tooltip: { trigger: "axis" },
      grid: { left: 72, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: "time",
        axisLabel: {
          formatter: (value: number) =>
            new Date(value).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        },
      },
      yAxis: {
        type: "value",
        inverse: true,
        min: 0,
        max: 4,
        interval: 1,
        axisLabel: { formatter: (value: number) => stageLabels[value] ?? "" },
      },
      series: [
        {
          name: "Sleep stage",
          type: "line",
          step: "end",
          data: points,
          symbol: "none",
          lineStyle: { width: 3, color: "#7c3aed" },
          areaStyle: { color: "rgba(124, 58, 237, 0.12)" },
        },
      ],
    };
  }, [selectedSession]);

  if (!selectedDate)
    return <EmptyState message="Select a day to inspect its sleep stages." />;
  if (sessions.length === 0)
    return (
      <EmptyState
        message={`No sleep session was recorded on ${selectedDate}.`}
      />
    );
  return (
    <div className="space-y-3">
      {sessions.length > 1 ? (
        <div>
          <p className="mb-2 text-sm text-white/60">
            {sessions.length} sleep sessions recorded. The longest is shown by
            default.
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Sleep sessions"
          >
            {sessions.map((session, index) => {
              const active = session.id === selectedSession?.id;
              const minutes = sleepMinutes(session);
              return (
                <button
                  key={session.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectSleepSession(session.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${active ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/75 hover:bg-white/10"}`}
                >
                  <span className="block font-semibold">
                    {index === 0 ? "Longest sleep" : `Session ${index + 1}`}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatSessionTime(session.startAt, session.endAt)} ·{" "}
                    {formatDuration(minutes)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-white/20 bg-white">
        <ReactECharts
          option={chartOptions}
          style={{ height: 360, width: "100%" }}
        />
      </div>
    </div>
  );
}

function formatSessionTime(startAt: string, endAt: string) {
  const time = (value: string) =>
    new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  return `${time(startAt)}–${time(endAt)}`;
}

function formatDuration(minutes: number) {
  const wholeMinutes = Math.round(minutes);
  return `${Math.floor(wholeMinutes / 60)}h ${wholeMinutes % 60}m`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/30 text-sm text-white/60">
      {message}
    </div>
  );
}
