import type { SleepEvent } from "~/domain/analytics";
import type { SleepSession } from "~/domain/health";
import { sleepMinutes } from "~/domain/sleep";
import { healthSourceLabel } from "~/features/health/sourceLabels";

export function SleepEventTabs({
  events,
  selectedEvent,
  onSelect,
}: {
  events: SleepEvent[];
  selectedEvent: SleepEvent | undefined;
  onSelect: (event: SleepEvent) => void;
}) {
  if (events.length <= 1) return null;
  return (
    <div>
      <p className="mb-2 text-sm text-white/75">
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
              onClick={() => onSelect(event)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${active ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"}`}
            >
              <span className="block font-semibold">
                {`Sleep ${index + 1} · ${event.recordings
                  .map((recording) => healthSourceLabel(recording.source))
                  .join(" + ")}`}
              </span>
              <span className="text-xs opacity-75">
                {formatSessionTime(event.primary.startAt, event.primary.endAt)}{" "}
                · {formatDuration(minutes)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecordingTabs({
  event,
  combinedMode,
  selectedSession,
  onSelectCombined,
  onSelectRecording,
}: {
  event: SleepEvent;
  combinedMode: boolean;
  selectedSession: SleepSession | undefined;
  onSelectCombined: () => void;
  onSelectRecording: (recording: SleepSession) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-white/75">
        {event.recordings.length > 1
          ? `This sleep was recorded by ${event.recordings.length} devices. Choose which recording to inspect:`
          : "Recording source:"}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Device recordings"
      >
        {event.recordings.length > 1 ? (
          <button
            type="button"
            role="tab"
            aria-selected={combinedMode}
            onClick={onSelectCombined}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${combinedMode ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"}`}
          >
            Combined · {event.recordings.length} devices
          </button>
        ) : null}
        {event.recordings.map((recording) => {
          const active = !combinedMode && recording.id === selectedSession?.id;
          return (
            <button
              key={recording.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectRecording(recording)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-violet-300 bg-violet-500 text-white" : "border-white/20 bg-white/5 text-white/85 hover:bg-white/10"}`}
            >
              {healthSourceLabel(recording.source)} ·{" "}
              {formatDuration(sleepMinutes(recording))}
            </button>
          );
        })}
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
