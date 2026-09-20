"use client";

import { useQuery } from "@apollo/client/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { DateKey, HealthSnapshot } from "~/domain/health";
import { adaptOverview } from "~/server/health/adapters/overviewAdapter";
import { OVERVIEW_QUERY } from "~/server/health/graphql/overviewQuery";
import { selectDefaultSleepSession } from "./selectors";

interface HealthDataState {
  snapshot: HealthSnapshot;
  selectedDate: DateKey | null;
  selectedSleepSessionId: string | null;
  refreshFailed: boolean;
}

type HealthDataAction =
  | { type: "dateSelected"; date: DateKey | null }
  | { type: "sleepSessionSelected"; sessionId: string }
  | { type: "snapshotReceived"; snapshot: HealthSnapshot }
  | { type: "refreshFailed" };

interface HealthDataContextValue extends HealthDataState {
  selectDate: (date: DateKey | null) => void;
  selectSleepSession: (sessionId: string) => void;
}

const HealthDataContext = createContext<HealthDataContextValue | null>(null);

function mostRecentDate(snapshot: HealthSnapshot): DateKey | null {
  const { analytics } = snapshot;
  return (
    [
      ...analytics.sleepEvents.map((event) => event.date),
      ...analytics.sleepDebt.daily.map((day) => day.date),
      ...analytics.sleepConsistency.daily.map((day) => day.date),
      ...analytics.steps.daily.map((day) => day.date),
      ...analytics.activeCalories.daily.map((day) => day.date),
      ...analytics.totalCalories.daily.map((day) => day.date),
      ...analytics.restingHeartRate.daily.map((day) => day.date),
      ...analytics.weight.daily.map((day) => day.date),
    ].sort((a, b) => b.localeCompare(a))[0] ?? null
  );
}

function reducer(
  state: HealthDataState,
  action: HealthDataAction,
): HealthDataState {
  switch (action.type) {
    case "dateSelected":
      return {
        ...state,
        selectedDate: action.date,
        selectedSleepSessionId:
          selectDefaultSleepSession(state.snapshot, action.date)?.id ?? null,
      };
    case "sleepSessionSelected":
      return { ...state, selectedSleepSessionId: action.sessionId };
    case "snapshotReceived": {
      const selectedDate =
        state.selectedDate ?? mostRecentDate(action.snapshot);
      const selectedSessionStillExists = action.snapshot.sleepSessions.some(
        (session) => session.id === state.selectedSleepSessionId,
      );
      return {
        snapshot: action.snapshot,
        selectedDate,
        selectedSleepSessionId: selectedSessionStillExists
          ? state.selectedSleepSessionId
          : (selectDefaultSleepSession(action.snapshot, selectedDate)?.id ??
            null),
        refreshFailed: false,
      };
    }
    case "refreshFailed":
      return { ...state, refreshFailed: true };
  }
}

export function HealthDataProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: HealthSnapshot;
  children: ReactNode;
}) {
  const initialDate = mostRecentDate(initialSnapshot);
  const [state, dispatch] = useReducer(reducer, {
    snapshot: initialSnapshot,
    selectedDate: initialDate,
    selectedSleepSessionId:
      selectDefaultSleepSession(initialSnapshot, initialDate)?.id ?? null,
    refreshFailed: false,
  });

  const selectDate = useCallback((date: DateKey | null) => {
    dispatch({ type: "dateSelected", date });
  }, []);

  const selectSleepSession = useCallback((sessionId: string) => {
    dispatch({ type: "sleepSessionSelected", sessionId });
  }, []);

  const value = useMemo(
    () => ({ ...state, selectDate, selectSleepSession }),
    [state, selectDate, selectSleepSession],
  );

  /**
   * The 60s refresh, previously a `setInterval` around `fetch("/api/health")`.
   * Apollo polls the same query the server already rendered from, through the
   * same-origin `/api/graphql` proxy, so the browser never holds a credential.
   *
   * `errorPolicy: "all"` rather than the default: HCGateway's contract is
   * partial-data-friendly, so a response carrying both `data` and `errors`
   * should still render the data it did send. Set per-operation because a
   * global `defaultOptions` breaks the hooks' return-type narrowing.
   *
   * No loading state is read, and that is the point: `initialSnapshot` is
   * already the RSC render of this exact query, so the first paint uses it and
   * a poll only ever replaces it. Reading `loading` here would introduce the
   * client-side flash the server render exists to avoid.
   */
  const { data, error } = useQuery(OVERVIEW_QUERY, {
    pollInterval: 60_000,
    errorPolicy: "all",
    // The RSC path already fetched this; going to the network on mount would
    // duplicate that request for no new data. Polls are network requests
    // regardless of this policy.
    fetchPolicy: "cache-first",
  });

  const analytics = data?.viewer.analytics;

  useEffect(() => {
    if (!analytics) return;
    dispatch({ type: "snapshotReceived", snapshot: adaptOverview(analytics) });
  }, [analytics]);

  useEffect(() => {
    if (!error) return;
    console.error("Unable to refresh health data", error.message);
    dispatch({ type: "refreshFailed" });
  }, [error]);

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData(): HealthDataContextValue {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error("useHealthData must be used inside HealthDataProvider");
  }
  return context;
}
