"use client";

import { useEffect, useState } from "react";
import type { SleepStage } from "~/domain/health";

/**
 * Loads stage timelines for one date from `/api/sleep-stages`.
 *
 * The overview's snapshot omits stages because fetching them for all history
 * costs 5.5 MB versus 321 KB without (see `server/health/graphql/overviewQuery.ts`),
 * so the stage graph pulls them for the selected day only.
 *
 * `stagesByRecordingId` is `null` until a response arrives, which the caller
 * uses to tell "still loading" apart from "this day has no stages" — the
 * distinction that keeps an unavailable fetch from rendering as real absence.
 */
export function useSleepStages(date: string | null): {
  stagesByRecordingId: Record<string, SleepStage[]> | null;
  unavailable: boolean;
} {
  const [state, setState] = useState<{
    date: string | null;
    stages: Record<string, SleepStage[]> | null;
    unavailable: boolean;
  }>({ date: null, stages: null, unavailable: false });

  useEffect(() => {
    if (!date) {
      setState({ date: null, stages: {}, unavailable: false });
      return;
    }

    // Guards against a slower earlier request overwriting a newer date's
    // result when the user clicks through the calendar quickly.
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/sleep-stages?date=${encodeURIComponent(date)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const body = (await response.json()) as {
          events?: {
            recordings: { id: string; stages: SleepStage[] }[];
          }[];
        };
        if (!active) return;
        const stages: Record<string, SleepStage[]> = {};
        for (const event of body.events ?? []) {
          for (const recording of event.recordings) {
            stages[recording.id] = recording.stages;
          }
        }
        setState({ date, stages, unavailable: false });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        console.error(
          "Unable to load sleep stages",
          error instanceof Error ? error.message : String(error),
        );
        setState({ date, stages: null, unavailable: true });
      }
    };

    setState((previous) =>
      previous.date === date
        ? previous
        : { date: null, stages: null, unavailable: false },
    );
    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [date]);

  return {
    stagesByRecordingId: state.date === date ? state.stages : null,
    unavailable: state.date === date && state.unavailable,
  };
}
