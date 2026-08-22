"use client";

import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { SleepStageKind } from "~/domain/health";
import { sleepMinutes } from "~/domain/sleep";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectSleepEventsForDate } from "~/features/health/selectors";
import { healthSourceLabel } from "~/features/health/sourceLabels";

const stageOrder: Record<SleepStageKind, number> = {
  awake: 0,
  rem: 1,
  light: 2,
  asleep: 2,
  deep: 3,
  unknown: 4,
};
const stageLabels = ["Awake", "REM", "Light", "Deep", "Unknown"];
const recordingColors = ["#7c3aed", "#0891b2", "#ea580c", "#16a34a"];

export function SleepStagesGraph() {
  const [showCombined, setShowCombined] = useState(true);
  const { snapshot, selectedDate, selectedSleepSessionId, selectSleepSession } =
    useHealthData();
  const events = selectSleepEventsForDate(snapshot, selectedDate);
  const selectedEvent =
    events.find((event) =>
      event.recordings.some(
        (recording) => recording.id === selectedSleepSessionId,
      ),
    ) ?? events[0];
  const selectedSession =
    selectedEvent?.recordings.find(
      (session) => session.id === selectedSleepSessionId,
    ) ?? selectedEvent?.primary;
  const combinedMode =
    showCombined && (selectedEvent?.recordings.length ?? 0) > 1;

  useEffect(() => {
    setShowCombined(true);
  }, [selectedEvent?.id]);

  const chartOptions = useMemo(() => {
    const displayedRecordings = combinedMode
      ? (selectedEvent?.recordings ?? [])
      : selectedSession
        ? [selectedSession]
        : [];
    const labelCounts = new Map<string, number>();
    const series = displayedRecordings.map((recording, index) => {
      const source = healthSourceLabel(recording.source);
      const occurrence = (labelCounts.get(source) ?? 0) + 1;
      labelCounts.set(source, occurrence);
      const label = occurrence > 1 ? `${source} ${occurrence}` : source;
      const color = recordingColors[index % recordingColors.length];
      return {
        name: label,
        type: "line",
        step: "end",
        data: recording.stages.flatMap((stage) => [
          [Date.parse(stage.startAt), stageOrder[stage.kind]],
          [Date.parse(stage.endAt), stageOrder[stage.kind]],
        ]),
        symbol: "none",
        lineStyle: { width: combinedMode ? 2.5 : 3, color },
        areaStyle: combinedMode ? undefined : { color: `${color}22` },
      };
    });

    return {
      backgroundColor: "#ffffff",
      tooltip: { trigger: "axis" },
      legend: combinedMode
        ? { top: 12, textStyle: { color: "#334155" } }
        : undefined,
      grid: { left: 72, right: 24, top: combinedMode ? 52 : 24, bottom: 48 },
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
      series,
    };
  }, [combinedMode, selectedEvent, selectedSession]);

  if (!selectedDate)
    return <EmptyState message="Select a day to inspect its sleep stages." />;
  if (events.length === 0)
    return (
      <EmptyState
        message={`No sleep session was recorded on ${selectedDate}.`}
      />
    );
  return (
    <div className="space-y-3">
      {events.length > 1 ? (
        <div>
          <p className="mb-2 text-sm text-white/60">
            {events.length} separate sleep events recorded on this day.
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Sleep events"
          >
            {events.map((event, index) => {
              const active = event.id === selectedEvent?.id;
              const minutes = sleepMinutes(event.primary);
              return (
                <button
                  key={event.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setShowCombined(event.recordings.length > 1);
                    selectSleepSession(event.primary.id);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${active ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/75 hover:bg-white/10"}`}
                >
                  <span className="block font-semibold">
                    {`Sleep ${index + 1} · ${event.recordings
                      .map((recording) => healthSourceLabel(recording.source))
                      .join(" + ")}`}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatSessionTime(
                      event.primary.startAt,
                      event.primary.endAt,
                    )}{" "}
                    · {formatDuration(minutes)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {selectedEvent ? (
        <div>
          <p className="mb-2 text-sm text-white/60">
            {selectedEvent.recordings.length > 1
              ? `This sleep was recorded by ${selectedEvent.recordings.length} devices. Choose which recording to inspect:`
              : "Recording source:"}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Device recordings"
          >
            {selectedEvent.recordings.length > 1 ? (
              <button
                type="button"
                role="tab"
                aria-selected={combinedMode}
                onClick={() => setShowCombined(true)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${combinedMode ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/75 hover:bg-white/10"}`}
              >
                Combined · {selectedEvent.recordings.length} devices
              </button>
            ) : null}
            {selectedEvent.recordings.map((recording) => {
              const active =
                !combinedMode && recording.id === selectedSession?.id;
              return (
                <button
                  key={recording.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setShowCombined(false);
                    selectSleepSession(recording.id);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/75 hover:bg-white/10"}`}
                >
                  {healthSourceLabel(recording.source)} ·{" "}
                  {formatDuration(sleepMinutes(recording))}
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
