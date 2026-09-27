import { DeviceIllustration } from "./DeviceIllustration";

type FeedKey =
  | "sleep"
  | "steps"
  | "activeCalories"
  | "totalCalories"
  | "restingHeartRate"
  | "weight";

const feeds: Array<{
  key: FeedKey;
  label: string;
  record: string;
  algorithms: string[];
}> = [
  {
    key: "sleep",
    label: "Sleep & stages",
    record: "SleepSessionRecord",
    algorithms: [
      "Sleep reconciliation",
      "Sleep debt",
      "Sleep consistency",
      "Healthspan",
    ],
  },
  {
    key: "steps",
    label: "Steps",
    record: "StepsRecord",
    algorithms: ["Daily activity", "Healthspan"],
  },
  {
    key: "activeCalories",
    label: "Active energy",
    record: "ActiveCaloriesBurnedRecord",
    algorithms: ["Calorie trends"],
  },
  {
    key: "totalCalories",
    label: "Total energy",
    record: "TotalCaloriesBurnedRecord",
    algorithms: ["Calorie trends"],
  },
  {
    key: "restingHeartRate",
    label: "Resting heart rate",
    record: "RestingHeartRateRecord",
    algorithms: ["RHR trend", "Healthspan"],
  },
  {
    key: "weight",
    label: "Weight",
    record: "WeightRecord",
    algorithms: ["Weight trend"],
  },
];

const missingFeeds = [
  {
    label: "Continuous heart rate",
    record: "HeartRateRecord",
    reason: "No repository mapper or database field",
  },
  {
    label: "Heart-rate variability",
    record: "HeartRateVariabilityRmssdRecord",
    reason: "No repository mapper or database field",
  },
  {
    label: "Blood oxygen (SpO₂)",
    record: "OxygenSaturationRecord",
    reason: "Exported by WHOOP; not ingested",
  },
  {
    label: "Respiratory rate",
    record: "RespiratoryRateRecord",
    reason: "Exported by WHOOP; not ingested",
  },
  {
    label: "Skin temperature",
    record: "SkinTemperatureRecord",
    reason: "Health Connect supports it; not ingested",
  },
  {
    label: "Exercise sessions",
    record: "ExerciseSessionRecord",
    reason: "No repository mapper or database field",
  },
  {
    label: "Distance",
    record: "DistanceRecord",
    reason: "No repository mapper or database field",
  },
  {
    label: "Floors / elevation",
    record: "FloorsClimbedRecord",
    reason: "No repository mapper or database field",
  },
];

const devices = [
  {
    name: "WHOOP 4.0",
    kind: "whoop" as const,
    caption: "Continuous recovery wearable",
    sensors: [
      "5-LED optical PPG",
      "4 photodiodes",
      "Pulse oximeter",
      "Skin temperature",
      "3-axis accelerometer",
    ],
    exposure: [
      "Sleep",
      "Steps",
      "Calories",
      "Resting HR",
      "Respiratory rate",
      "Blood oxygen",
      "Exercise",
    ],
    accent: "emerald",
  },
  {
    name: "Pixel Watch 2",
    kind: "pixel" as const,
    caption: "Wear OS smartwatch",
    sensors: [
      "Multi-path optical HR",
      "Red + infrared SpO₂",
      "ECG electrodes",
      "cEDA",
      "Skin temperature",
      "Accelerometer + gyro",
      "Altimeter + barometer",
    ],
    exposure: [
      "Sleep",
      "Steps",
      "Calories",
      "Resting HR",
      "HRV",
      "SpO₂",
      "Respiratory rate",
      "Exercise",
    ],
    accent: "sky",
  },
];

export function DataSourcesPage({
  feedStatus: status,
}: {
  /**
   * Which feeds have any data. Passed in rather than derived from a whole
   * `HealthAnalytics` object: presence is all this page ever needed, and the
   * GraphQL path answers it with counts instead of transferring the series.
   */
  feedStatus: Record<FeedKey, boolean>;
}) {
  const recordedCount = Object.values(status).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#090d17] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.24em] text-cyan-300 uppercase">
              Signal inventory
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Data sources
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              A traceable map from physical sensors, through Android Health
              Connect, into this dashboard’s processing models.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-xs text-slate-500">Database coverage</p>
            <p className="mt-1 text-2xl font-bold">
              {recordedCount} / {feeds.length}{" "}
              <span className="text-sm font-normal text-slate-400">
                implemented feeds
              </span>
            </p>
          </div>
        </header>

        <section
          className="mt-10 grid gap-4 lg:grid-cols-2"
          aria-label="Source devices"
        >
          {devices.map((device) => (
            <article
              key={device.name}
              className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-[12rem_1fr]"
            >
              <div>
                <DeviceIllustration kind={device.kind} />
                <h2 className="mt-4 text-xl font-bold">{device.name}</h2>
                <p className="text-sm text-slate-500">{device.caption}</p>
              </div>
              <div className="grid gap-4">
                <DeviceList
                  title="Hardware sensor array"
                  values={device.sensors}
                  color={device.accent}
                />
                <DeviceList
                  title="Companion app / Health Connect signals"
                  values={device.exposure}
                  color={device.accent}
                />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12" aria-labelledby="flow-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">
                Live pipeline map
              </p>
              <h2 id="flow-title" className="mt-2 text-2xl font-bold">
                Health Connect → database → algorithms
              </h2>
            </div>
            <div className="flex gap-4 text-xs text-slate-400">
              <Key color="bg-emerald-400" label="Recorded" />
              <Key color="bg-rose-400" label="Not recorded" />
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1320]">
            <div className="grid grid-cols-[1fr_auto_1fr] border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase sm:grid-cols-[1fr_5rem_1fr_5rem_1fr]">
              <span>Health Connect record</span>
              <span />
              <span>Database intake</span>
              <span className="hidden sm:block" />
              <span className="hidden sm:block">Processing outputs</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {feeds.map((feed) => (
                <div
                  key={feed.key}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 sm:grid-cols-[1fr_5rem_1fr_5rem_1fr]"
                >
                  <div>
                    <p className="font-semibold">{feed.label}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {feed.record}
                    </p>
                  </div>
                  <FlowLine active={status[feed.key]} />
                  <div
                    className={`rounded-xl border px-3 py-2 ${status[feed.key] ? "border-emerald-400/25 bg-emerald-400/10" : "border-rose-400/25 bg-rose-400/10"}`}
                  >
                    <p
                      className={`text-xs font-bold ${status[feed.key] ? "text-emerald-300" : "text-rose-300"}`}
                    >
                      {status[feed.key] ? "● Recorded" : "● No records"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Mapper + analytics schema ready
                    </p>
                  </div>
                  <FlowLine
                    active={status[feed.key]}
                    className="hidden sm:flex"
                  />
                  <div className="col-span-3 mt-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:mt-0">
                    {feed.algorithms.map((algorithm) => (
                      <span
                        key={algorithm}
                        className="rounded-md bg-violet-400/10 px-2 py-1 text-xs text-violet-200"
                      >
                        {algorithm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-rose-400/15 bg-rose-400/[0.035] p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.2em] text-rose-300 uppercase">
            Android + database backlog
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Available signals we are not storing
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            These require a Health Connect permission/read path in the Android
            gateway, a raw observation model and repository mapper here, then
            analytics persistence and UI treatment.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {missingFeeds.map((feed) => (
              <article
                key={feed.record}
                className="rounded-xl border border-white/8 bg-black/15 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{feed.label}</h3>
                  <span className="rounded-full bg-rose-400/10 px-2 py-1 text-[10px] font-bold text-rose-300">
                    NOT IN DB
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-slate-500">
                  {feed.record}
                </p>
                <p className="mt-2 text-xs text-slate-400">{feed.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-8 text-xs leading-5 text-slate-500">
          Device capabilities are modeled as WHOOP 4.0 and Pixel Watch 2. A
          sensor indicates measurement hardware; Health Connect availability
          still depends on the companion app, region, membership, permissions
          and sync settings. Sources:{" "}
          <a
            className="text-slate-300 underline decoration-white/20 hover:text-white"
            href="https://support.whoop.com/s/article/Google-Health-Integration-For-Android"
          >
            WHOOP Health Connect integration
          </a>
          ,{" "}
          <a
            className="text-slate-300 underline decoration-white/20 hover:text-white"
            href="https://support.google.com/googlepixelwatch/answer/12651869"
          >
            Pixel Watch specifications
          </a>
          , and{" "}
          <a
            className="text-slate-300 underline decoration-white/20 hover:text-white"
            href="https://developer.android.com/health-and-fitness/health-connect/data-types"
          >
            Android Health Connect data types
          </a>
          .
        </footer>
      </div>
    </main>
  );
}

function DeviceList({
  title,
  values,
  color,
}: {
  title: string;
  values: string[];
  color: string;
}) {
  const colors =
    color === "emerald"
      ? "border-emerald-400/15 bg-emerald-400/5"
      : "border-sky-400/15 bg-sky-400/5";
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
        {title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className={`rounded-md border px-2 py-1 text-xs text-slate-300 ${colors}`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowLine({
  active,
  className = "",
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center ${className}`} aria-hidden="true">
      <i
        className={`h-px flex-1 ${active ? "bg-emerald-400/60" : "bg-rose-400/40"}`}
      />
      <i
        className={`size-1.5 rotate-45 border-t border-r ${active ? "border-emerald-400" : "border-rose-400"}`}
      />
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
