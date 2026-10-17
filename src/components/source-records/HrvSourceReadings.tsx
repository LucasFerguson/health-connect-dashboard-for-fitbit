import Link from "next/link";
import { settle } from "~/server/health/backendDiagnostics";
import { getHrvReadings } from "~/server/health/getSourceRecords";
import {
  HRV_RECORDS_WINDOWS,
  formatMilliseconds,
  groupHrvByNight,
  type HrvRecordsWindow,
} from "~/domain/sourceRecords";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import {
  SourceRecordsEmpty,
  SourceRecordsError,
  SourceRecordsSection,
} from "./SourceRecordsSection";

/**
 * Every HRV (RMSSD) reading in the window, grouped by night with an
 * expandable list of each 5-minute reading. Values are shown as reported.
 */
export async function HrvSourceReadings({
  window,
}: {
  window: HrvRecordsWindow;
}) {
  const result = await settle(getHrvReadings(window));
  if (!result.ok)
    return <SourceRecordsError diagnostics={result.diagnostics} />;
  const { timeZone, records } = result.data;
  const nights = groupHrvByNight(records, timeZone);
  const windowLabel =
    HRV_RECORDS_WINDOWS.find((option) => option.value === window)?.label ??
    window;

  return (
    <SourceRecordsSection
      description={
        <>
          <p>
            {records.length.toLocaleString("en-US")}{" "}
            {records.length === 1 ? "reading" : "readings"} across{" "}
            {nights.length} {nights.length === 1 ? "night" : "nights"} (
            {windowLabel.toLowerCase()}), as stored from Health Connect. Each
            reading is an RMSSD value in milliseconds as reported by the source
            app.
          </p>
          <p className="mt-1">
            Nights are named by wake date: readings from local noon the day
            before up to noon belong to that night ({timeZone}). The chart above
            buckets by each reading&apos;s calendar date, so a night that
            crosses midnight can differ from its daily median there.
          </p>
        </>
      }
      actions={
        <nav aria-label="Source records window" className="flex gap-1">
          {HRV_RECORDS_WINDOWS.map((option) => (
            <Link
              key={option.value}
              href={
                option.value === "30" ? "/hrv" : `/hrv?records=${option.value}`
              }
              scroll={false}
              aria-current={option.value === window ? "page" : undefined}
              className={`rounded-lg px-2.5 py-1 text-xs whitespace-nowrap ${
                option.value === window
                  ? "bg-violet-300/25 text-white"
                  : "text-violet-200 hover:bg-white/10"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      }
    >
      {nights.length === 0 ? (
        <SourceRecordsEmpty>
          No HRV readings have been synced for this account in this window.
        </SourceRecordsEmpty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="hidden gap-x-2 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 sm:grid sm:grid-cols-[minmax(0,1fr)_repeat(4,6rem)]">
            <span>Night</span>
            <span className="text-right">Readings</span>
            <span className="text-right">Min</span>
            <span className="text-right">Median</span>
            <span className="text-right">Max</span>
          </div>
          <ul className="divide-y divide-white/10">
            {nights.map((night) => (
              <li key={`${night.night}-${night.source}`}>
                <details className="group">
                  <summary className="grid cursor-pointer grid-cols-4 items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm tabular-nums hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_repeat(4,6rem)] [&::-webkit-details-marker]:hidden">
                    <span className="col-span-4 min-w-0 sm:col-span-1">
                      <span className="mr-1 inline-block text-white/50 transition-transform group-open:rotate-90">
                        ›
                      </span>
                      <span className="font-medium">{night.night}</span>
                      <span className="ml-2 text-xs text-white/50">
                        {healthSourceLabel(night.source)}
                      </span>
                    </span>
                    <span className="sm:text-right">
                      <span className="block text-[10px] text-white/50 sm:hidden">
                        Readings
                      </span>
                      {night.count}
                    </span>
                    <span className="sm:text-right">
                      <span className="block text-[10px] text-white/50 sm:hidden">
                        Min
                      </span>
                      {formatMilliseconds(night.min)}
                    </span>
                    <span className="sm:text-right">
                      <span className="block text-[10px] text-white/50 sm:hidden">
                        Median
                      </span>
                      {formatMilliseconds(night.median)}
                    </span>
                    <span className="sm:text-right">
                      <span className="block text-[10px] text-white/50 sm:hidden">
                        Max
                      </span>
                      {formatMilliseconds(night.max)}
                    </span>
                  </summary>
                  <div className="border-t border-white/10 bg-black/10 px-3 py-3">
                    <p className="mb-2 text-xs text-white/50">
                      {night.source} · {night.count} readings
                    </p>
                    <ol className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs tabular-nums sm:grid-cols-4 lg:grid-cols-6">
                      {night.readings.map((reading) => (
                        <li
                          key={reading.id}
                          className="flex justify-between gap-2"
                        >
                          <span className="text-white/60">{reading.time}</span>
                          <span>{formatMilliseconds(reading.ms)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SourceRecordsSection>
  );
}
