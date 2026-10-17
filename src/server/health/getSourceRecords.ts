/**
 * Raw source-record reads for the "Source records" sections on
 * /skin-temperature and /hrv. No filtering or cleanup: records are passed
 * through as HCGateway returns them.
 */
import type {
  HrvSourceReading,
  HrvRecordsWindow,
  SkinTemperatureSourceRecord,
} from "~/domain/sourceRecords";
import { hrvRecordsRange } from "~/domain/sourceRecords";
import { withViewer } from "./graphql/fetchAnalytics";
import {
  HRV_READINGS_QUERY,
  SKIN_TEMPERATURE_RECORDS_QUERY,
} from "./graphql/sourceRecordsQuery";

export interface SourceRecords<T> {
  timeZone: string;
  records: T[];
}

/** Throws when GraphQL can't serve it; see `withViewer`. */
export function getSkinTemperatureRecords() {
  return withViewer(
    "skin-temperature-records",
    SKIN_TEMPERATURE_RECORDS_QUERY,
    (viewer): SourceRecords<SkinTemperatureSourceRecord> => ({
      timeZone: viewer.config.homeTimeZone,
      records: viewer.sourceRecords.skinTemperature.map((record) => ({
        id: record.id,
        source: record.source,
        startAt: record.startAt,
        endAt: record.endAt,
        baselineCelsius: record.baselineCelsius,
        deltas: record.deltas.map((delta) => ({
          observedAt: delta.observedAt,
          celsius: delta.celsius,
        })),
        measurementLocation: record.measurementLocation,
      })),
    }),
  );
}

/** Throws when GraphQL can't serve it; see `withViewer`. */
export function getHrvReadings(window: HrvRecordsWindow) {
  return withViewer(
    "hrv-readings",
    HRV_READINGS_QUERY,
    (viewer): SourceRecords<HrvSourceReading> => ({
      timeZone: viewer.config.homeTimeZone,
      records: viewer.sourceRecords.heartRateVariability.map((reading) => ({
        id: reading.id,
        source: reading.source,
        observedAt: reading.observedAt,
        milliseconds: reading.milliseconds,
      })),
    }),
    { range: hrvRecordsRange(window, new Date()) },
  );
}
