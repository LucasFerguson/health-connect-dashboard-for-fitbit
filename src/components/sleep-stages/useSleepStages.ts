"use client";

import { useEffect, useMemo } from "react";
import { skipToken, useQuery } from "@apollo/client/react";
import { isDateKey, type SleepStage } from "~/domain/health";
import {
  adaptSleepStages,
  sleepStagesRange,
} from "~/server/health/adapters/sleepStagesAdapter";
import { SLEEP_STAGES_QUERY } from "~/server/health/graphql/sleepStagesQuery";

/**
 * Loads stage timelines for one date through the client Apollo Client, which
 * posts to the same-origin `/api/graphql` proxy with `$range` as a variable.
 *
 * The overview's snapshot omits stages because fetching them for all history
 * costs 5.5 MB versus 321 KB without (see `server/health/graphql/overviewQuery.ts`),
 * so the stage graph pulls them for the selected day only.
 *
 * `stagesByRecordingId` is `null` until a response arrives, which the caller
 * uses to tell "still loading" apart from "this day has no stages" — the
 * distinction that keeps an unavailable fetch from rendering as real absence.
 * A failed request sets `unavailable` and leaves the map `null`; it never
 * becomes `{}`, which would draw an empty chart that reads as "no stages".
 */
export function useSleepStages(date: string | null): {
  stagesByRecordingId: Record<string, SleepStage[]> | null;
  unavailable: boolean;
} {
  // A date that isn't `YYYY-MM-DD` can't form a valid range. It can only come
  // from a malformed snapshot, so report it as unavailable rather than asking
  // the backend for a range it would reject.
  const validDate = isDateKey(date) ? date : null;

  const { data, error } = useQuery(
    SLEEP_STAGES_QUERY,
    validDate
      ? {
          variables: { range: sleepStagesRange(validDate) },
          // Bypasses the normalized cache entirely, for two reasons. Today's
          // stages grow as the phone syncs, so a cached day would go stale
          // with no poll to refresh it. And this result shares the unkeyed
          // `viewer` root with the overview poll's much larger entry; keeping
          // it out of the cache means a stage fetch can never replace or
          // invalidate that entry and trigger a 321 KB refetch.
          fetchPolicy: "no-cache",
        }
      : skipToken,
  );

  useEffect(() => {
    if (!error) return;
    console.error("Unable to load sleep stages", error.message);
  }, [error]);

  // Apollo drops `data` when the variables change, so a slow response for an
  // earlier date can't overwrite a newer one, and the graph shows its loading
  // state rather than the previous day's chart while the new date loads.
  const stagesByRecordingId = useMemo(
    () => (data ? adaptSleepStages(data) : null),
    [data],
  );

  if (date === null) return { stagesByRecordingId: {}, unavailable: false };
  if (!validDate) return { stagesByRecordingId: null, unavailable: true };
  return {
    stagesByRecordingId: error ? null : stagesByRecordingId,
    unavailable: Boolean(error),
  };
}
