import { settle } from "~/server/health/backendDiagnostics";
import { getSkinTemperatureRecords } from "~/server/health/getSourceRecords";
import { skinTemperatureRows } from "~/domain/sourceRecords";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import {
  SourceRecordsEmpty,
  SourceRecordsError,
  SourceRecordsSection,
} from "./SourceRecordsSection";

const th = "px-3 py-2 text-left font-semibold whitespace-nowrap";
const td = "px-3 py-2 align-top whitespace-nowrap";

/**
 * Every Health Connect SkinTemperature record, newest first, every field —
 * including Fitbit's baseline, which reads far above any plausible skin
 * temperature. It is shown as reported.
 */
export async function SkinTemperatureSourceRecords() {
  const result = await settle(getSkinTemperatureRecords());
  if (!result.ok)
    return <SourceRecordsError diagnostics={result.diagnostics} />;
  const { timeZone, records } = result.data;
  const rows = skinTemperatureRows(records, timeZone);

  return (
    <SourceRecordsSection
      description={
        <>
          <p>
            {rows.length === 1 ? "1 record" : `${rows.length} records`}, as
            stored from Health Connect, newest first. Times are in {timeZone};
            the night is the local date the record ends on.
          </p>
          <p className="mt-1">
            Delta and baseline are as reported by the source app. Delta °F is a
            temperature difference (no +32). Measurement location is Health
            Connect&apos;s constant: 0 unknown, 1 finger, 2 toe, 3 wrist.
          </p>
        </>
      }
    >
      {rows.length === 0 ? (
        <SourceRecordsEmpty>
          No skin-temperature records have been synced for this account.
        </SourceRecordsEmpty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-sm tabular-nums">
            <thead className="bg-white/5 text-xs text-white/70">
              <tr>
                <th className={`${th} sticky left-0 bg-[#2a1f4f]`}>Night</th>
                <th className={th}>Start → end</th>
                <th className={th}>Duration</th>
                <th className={th}>Delta °C</th>
                <th className={th}>Delta °F</th>
                <th className={th}>Baseline °C</th>
                <th className={th}>Baseline °F</th>
                <th className={th}>Location</th>
                <th className={th}>Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={row.record.id}>
                  <td
                    className={`${td} sticky left-0 bg-[#221a40] font-medium`}
                  >
                    {row.night}
                  </td>
                  <td className={td}>
                    {row.start} → {row.end}
                  </td>
                  <td className={td}>{row.duration}</td>
                  {row.deltas.length === 0 ? (
                    <>
                      <td className={td}>—</td>
                      <td className={td}>—</td>
                    </>
                  ) : (
                    <>
                      <td className={td}>
                        {row.deltas.map((delta, index) => (
                          <div key={`${delta.observedAt}-${index}`}>
                            {delta.celsius}
                            {row.deltas.length > 1 ? (
                              <span className="ml-1 text-xs text-white/50">
                                at {delta.time}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </td>
                      <td className={td}>
                        {row.deltas.map((delta, index) => (
                          <div key={`${delta.observedAt}-${index}`}>
                            {delta.fahrenheit}
                          </div>
                        ))}
                      </td>
                    </>
                  )}
                  <td
                    className={td}
                    title={
                      row.record.baselineCelsius === null
                        ? undefined
                        : String(row.record.baselineCelsius)
                    }
                  >
                    {row.baselineCelsius}
                  </td>
                  <td className={td}>{row.baselineFahrenheit}</td>
                  <td className={td}>{row.measurementLocation}</td>
                  <td className={td}>
                    {healthSourceLabel(row.record.source)}
                    <span className="block text-xs text-white/50">
                      {row.record.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SourceRecordsSection>
  );
}
