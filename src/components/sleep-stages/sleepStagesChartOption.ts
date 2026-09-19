import type { SleepSession, SleepStageKind } from "~/domain/health";
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

export function buildSleepStagesChartOption(
  displayedRecordings: SleepSession[],
  combinedMode: boolean,
) {
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
}
