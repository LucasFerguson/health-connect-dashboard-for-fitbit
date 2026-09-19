"use client";

import { useHealthData } from "~/features/health/HealthDataProvider";
import { DashboardStatusBar } from "./DashboardStatusBar";

export function ConnectedStatusBar() {
  const { snapshot, refreshFailed } = useHealthData();
  return (
    <DashboardStatusBar
      state={refreshFailed ? "stale" : "ready"}
      generatedAt={snapshot.generatedAt}
    />
  );
}
