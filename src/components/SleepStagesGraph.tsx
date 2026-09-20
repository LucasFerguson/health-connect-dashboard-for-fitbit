"use client";

import { useEffect, useMemo, useState } from "react";
import { LazyECharts as ReactECharts } from "./ui/LazyECharts";
import {
  RecordingTabs,
  SleepEventTabs,
} from "./sleep-stages/SleepEventAndRecordingTabs";
import { buildSleepStagesChartOption } from "./sleep-stages/sleepStagesChartOption";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectSleepEventsForDate } from "~/features/health/selectors";
import { useSleepStages } from "./sleep-stages/useSleepStages";

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

  // Stage timelines are not part of the page snapshot — fetching them for all
  // history costs 5.5 MB versus 321 KB without — so they load per selected day.
  // See server/health/graphql/overviewQuery.ts.
  const { stagesByRecordingId, unavailable: stagesUnavailable } =
    useSleepStages(selectedDate);

  useEffect(() => {
    setShowCombined(true);
  }, [selectedEvent?.id]);

  const chartOptions = useMemo(() => {
    const displayedRecordings = combinedMode
      ? (selectedEvent?.recordings ?? [])
      : selectedSession
        ? [selectedSession]
        : [];
    // Recordings arrive without stages; graft on the separately-fetched
    // timelines so the chart builder keeps its existing input shape.
    const withStages = displayedRecordings.map((recording) => ({
      ...recording,
      stages: stagesByRecordingId?.[recording.id] ?? recording.stages,
    }));
    return buildSleepStagesChartOption(withStages, combinedMode);
  }, [combinedMode, selectedEvent, selectedSession, stagesByRecordingId]);

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
      <SleepEventTabs
        events={events}
        selectedEvent={selectedEvent}
        onSelect={(event) => {
          setShowCombined(event.recordings.length > 1);
          selectSleepSession(event.primary.id);
        }}
      />
      {selectedEvent ? (
        <RecordingTabs
          event={selectedEvent}
          combinedMode={combinedMode}
          selectedSession={selectedSession}
          onSelectCombined={() => setShowCombined(true)}
          onSelectRecording={(recording) => {
            setShowCombined(false);
            selectSleepSession(recording.id);
          }}
        />
      ) : null}
      {stagesUnavailable ? (
        <EmptyState message="Sleep stage detail is unavailable right now." />
      ) : stagesByRecordingId === null ? (
        <EmptyState message="Loading sleep stages\u2026" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/20 bg-white">
          <ReactECharts
            option={chartOptions}
            style={{ height: 360, width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/30 text-sm text-white/60">
      {message}
    </div>
  );
}
