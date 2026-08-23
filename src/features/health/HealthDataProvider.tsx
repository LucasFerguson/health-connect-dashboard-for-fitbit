"use client";

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
import { selectDefaultSleepSession } from "./selectors";

interface HealthDataState {
  snapshot: HealthSnapshot;
  selectedDate: DateKey | null;
  selectedSleepSessionId: string | null;
}

type HealthDataAction =
  | { type: "dateSelected"; date: DateKey | null }
  | { type: "sleepSessionSelected"; sessionId: string }
  | { type: "snapshotReceived"; snapshot: HealthSnapshot };

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
      };
    }
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

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = (await response.json()) as HealthSnapshot;
        dispatch({ type: "snapshotReceived", snapshot });
      } catch (error) {
        console.error("Unable to refresh health data", error);
      }
    };

    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

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
