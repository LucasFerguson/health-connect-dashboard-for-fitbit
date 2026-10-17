/**
 * The data-sources page: which Health Connect record types the system asks
 * for, what actually landed in the database, and which analytics use them.
 *
 * The catalog below is static knowledge mirrored from HCGateway, so keep it in
 * sync when either side changes:
 *
 * - `collected`: the Android app's `RECORD_TYPES` list (`app/App.js`). Each
 *   requested type is stored in a collection named after it in lowerCamelCase.
 * - `usedBy`: the analytics `MAPPERS` (`api/analytics_engine/repository.py`)
 *   and what `pipeline.py` builds from each raw series.
 *
 * Counts, dates and sources are live, from `viewer.sources`.
 */

export type DataCategory =
  | "Sleep"
  | "Activity"
  | "Heart & vitals"
  | "Body"
  | "Nutrition"
  | "Cycle tracking";

export const CATEGORY_ORDER: DataCategory[] = [
  "Sleep",
  "Activity",
  "Heart & vitals",
  "Body",
  "Nutrition",
  "Cycle tracking",
];

export interface RecordTypeInfo {
  /** Health Connect record type, without the `Record` suffix. */
  type: string;
  label: string;
  category: DataCategory;
  /** Requested by the Android app, so synced when a source writes it. */
  collected: boolean;
  /** Dashboard features built from it. Empty means stored but unused. */
  usedBy: string[];
  /** A device writes it continuously, so a long silence means a source
   * stopped rather than nothing happening (unlike, say, weigh-ins). */
  continuous?: boolean;
  /** Why it isn't collected, or what to know about it. */
  note?: string;
}

export const RECORD_TYPES: RecordTypeInfo[] = [
  {
    type: "SleepSession",
    label: "Sleep sessions & stages",
    category: "Sleep",
    collected: true,
    continuous: true,
    usedBy: [
      "Sleep",
      "Sleep debt",
      "Consistency",
      "Healthspan",
      "Recovery",
      "Day",
    ],
  },
  {
    type: "Steps",
    label: "Steps",
    category: "Activity",
    collected: true,
    continuous: true,
    usedBy: ["Steps", "Healthspan", "Day"],
  },
  {
    type: "ActiveCaloriesBurned",
    label: "Active energy",
    category: "Activity",
    collected: true,
    usedBy: ["Calories", "Day"],
  },
  {
    type: "TotalCaloriesBurned",
    label: "Total energy",
    category: "Activity",
    collected: true,
    continuous: true,
    usedBy: ["Calories", "Day"],
  },
  {
    type: "ExerciseSession",
    label: "Exercise sessions",
    category: "Activity",
    collected: true,
    usedBy: ["Strain (workouts)", "Day"],
  },
  {
    type: "Distance",
    label: "Distance",
    category: "Activity",
    collected: true,
    continuous: true,
    usedBy: [],
  },
  {
    type: "ElevationGained",
    label: "Elevation gained",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "FloorsClimbed",
    label: "Floors climbed",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "Speed",
    label: "Speed",
    category: "Activity",
    collected: true,
    continuous: true,
    usedBy: [],
  },
  {
    type: "StepsCadence",
    label: "Steps cadence",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "Power",
    label: "Power",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "CyclingPedalingCadence",
    label: "Cycling cadence",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "WheelchairPushes",
    label: "Wheelchair pushes",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "Vo2Max",
    label: "VO₂ max",
    category: "Activity",
    collected: true,
    usedBy: [],
  },
  {
    type: "ExerciseRoute",
    label: "Exercise routes (GPS)",
    category: "Activity",
    collected: false,
    usedBy: [],
    note: "Needs its own location permission in the Android app. Treat as especially sensitive.",
  },
  {
    type: "HeartRate",
    label: "Heart rate",
    category: "Heart & vitals",
    collected: true,
    continuous: true,
    usedBy: ["Strain", "Day"],
  },
  {
    type: "RestingHeartRate",
    label: "Resting heart rate",
    category: "Heart & vitals",
    collected: true,
    continuous: true,
    usedBy: ["Heart", "Recovery", "Healthspan", "Strain baseline", "Day"],
  },
  {
    type: "HeartRateVariabilityRmssd",
    label: "Heart-rate variability (RMSSD)",
    category: "Heart & vitals",
    collected: false,
    usedBy: ["Recovery"],
    note: "The backend already maps it and Recovery is built to use it, but the Android app doesn't request it yet, so Recovery runs on a fallback.",
  },
  {
    type: "OxygenSaturation",
    label: "Blood oxygen (SpO₂)",
    category: "Heart & vitals",
    collected: true,
    continuous: true,
    usedBy: ["Day"],
  },
  {
    type: "RespiratoryRate",
    label: "Respiratory rate",
    category: "Heart & vitals",
    collected: true,
    continuous: true,
    usedBy: ["Day"],
  },
  {
    type: "SkinTemperature",
    label: "Skin temperature",
    category: "Heart & vitals",
    collected: false,
    usedBy: [],
    note: "Not requested by the Android app. The app's BodyTemperature is a different record type.",
  },
  {
    type: "BodyTemperature",
    label: "Body temperature",
    category: "Heart & vitals",
    collected: true,
    usedBy: [],
  },
  {
    type: "BasalBodyTemperature",
    label: "Basal body temperature",
    category: "Heart & vitals",
    collected: true,
    usedBy: [],
  },
  {
    type: "BloodPressure",
    label: "Blood pressure",
    category: "Heart & vitals",
    collected: true,
    usedBy: [],
  },
  {
    type: "BloodGlucose",
    label: "Blood glucose",
    category: "Heart & vitals",
    collected: true,
    usedBy: [],
  },
  {
    type: "Weight",
    label: "Weight",
    category: "Body",
    collected: true,
    usedBy: ["Weight"],
  },
  {
    type: "Height",
    label: "Height",
    category: "Body",
    collected: true,
    usedBy: [],
  },
  {
    type: "BodyFat",
    label: "Body fat",
    category: "Body",
    collected: true,
    usedBy: [],
  },
  {
    type: "LeanBodyMass",
    label: "Lean body mass",
    category: "Body",
    collected: true,
    usedBy: [],
  },
  {
    type: "BoneMass",
    label: "Bone mass",
    category: "Body",
    collected: true,
    usedBy: [],
  },
  {
    type: "BasalMetabolicRate",
    label: "Basal metabolic rate",
    category: "Body",
    collected: true,
    usedBy: [],
  },
  {
    type: "Hydration",
    label: "Hydration",
    category: "Nutrition",
    collected: true,
    usedBy: [],
  },
  {
    type: "Nutrition",
    label: "Nutrition",
    category: "Nutrition",
    collected: true,
    usedBy: [],
  },
  {
    type: "MenstruationFlow",
    label: "Menstruation flow",
    category: "Cycle tracking",
    collected: true,
    usedBy: [],
  },
  {
    type: "MenstruationPeriod",
    label: "Menstruation period",
    category: "Cycle tracking",
    collected: true,
    usedBy: [],
  },
  {
    type: "OvulationTest",
    label: "Ovulation test",
    category: "Cycle tracking",
    collected: true,
    usedBy: [],
  },
  {
    type: "CervicalMucus",
    label: "Cervical mucus",
    category: "Cycle tracking",
    collected: true,
    usedBy: [],
  },
];

/** HCGateway stores each record type in a collection named after it in
 * lowerCamelCase, e.g. `ActiveCaloriesBurned` → `activeCaloriesBurned`. */
export function collectionFor(type: string): string {
  return type.charAt(0).toLowerCase() + type.slice(1);
}

/** A continuous signal silent for longer than this has stopped arriving. */
export const STALE_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface InventorySignal {
  collection: string;
  records: number;
  earliest: string | null;
  latest: string | null;
  bySource: { source: string; count: number }[];
}

export interface InventorySource {
  source: string;
  label: string;
  records: number;
}

export interface InventoryDevice {
  sourceLabel: string;
  records: number;
  latest: string | null;
}

export type RecordStatus =
  | "receiving"
  | "stalled"
  | "no-data"
  | "not-collected";

export interface RecordRow extends RecordTypeInfo {
  status: RecordStatus;
  records: number;
  earliest: string | null;
  latest: string | null;
  /** Source apps by label, largest first. */
  sources: { label: string; records: number }[];
}

export function recordStatus(
  info: RecordTypeInfo,
  signal: InventorySignal | undefined,
  now: Date,
): RecordStatus {
  if (!info.collected && !signal?.records) return "not-collected";
  if (!signal?.records) return "no-data";
  if (
    info.continuous &&
    signal.latest &&
    now.getTime() - Date.parse(signal.latest) > STALE_AFTER_DAYS * DAY_MS
  ) {
    return "stalled";
  }
  return "receiving";
}

/** Joins the catalog with the live inventory. Sources sharing a label (each
 * phone install has its own Health Connect package) are merged. */
export function buildRecordRows(
  signals: InventorySignal[],
  sources: InventorySource[],
  now: Date,
): RecordRow[] {
  const byCollection = new Map(
    signals.map((signal) => [signal.collection, signal]),
  );
  const labelOf = new Map(
    sources.map((source) => [source.source, source.label]),
  );
  return RECORD_TYPES.map((info) => {
    const signal = byCollection.get(collectionFor(info.type));
    const merged = new Map<string, number>();
    for (const { source, count } of signal?.bySource ?? []) {
      const label = labelOf.get(source) ?? source;
      merged.set(label, (merged.get(label) ?? 0) + count);
    }
    return {
      ...info,
      status: recordStatus(info, signal, now),
      records: signal?.records ?? 0,
      earliest: signal?.earliest ?? null,
      latest: signal?.latest ?? null,
      sources: [...merged]
        .map(([label, records]) => ({ label, records }))
        .sort((a, b) => b.records - a.records),
    };
  });
}

export interface SourceRow {
  label: string;
  records: number;
  latest: string | null;
  stale: boolean;
}

/** One row per source app, with when it last wrote anything. The device
 * catalog splits a source into devices; take the newest across them. */
export function buildSourceRows(
  devices: InventoryDevice[],
  now: Date,
): SourceRow[] {
  const bySource = new Map<
    string,
    { records: number; latest: string | null }
  >();
  for (const device of devices) {
    const entry = bySource.get(device.sourceLabel) ?? {
      records: 0,
      latest: null,
    };
    entry.records += device.records;
    if (
      device.latest &&
      (!entry.latest || Date.parse(device.latest) > Date.parse(entry.latest))
    ) {
      entry.latest = device.latest;
    }
    bySource.set(device.sourceLabel, entry);
  }
  return [...bySource]
    .filter(([, entry]) => entry.latest !== null)
    .map(([label, entry]) => ({
      label,
      ...entry,
      stale:
        entry.latest !== null &&
        now.getTime() - Date.parse(entry.latest) > STALE_AFTER_DAYS * DAY_MS,
    }))
    .sort((a, b) => b.records - a.records);
}
