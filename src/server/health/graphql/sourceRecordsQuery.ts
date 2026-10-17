import { graphql } from "~/types/__generated__";
import {
  HrvSourceReadingsDocument,
  SkinTemperatureSourceRecordsDocument,
} from "~/types/__generated__/graphql";

/**
 * Raw source records for the "Source records" sections on /skin-temperature
 * and /hrv. Kept apart from `MetricSeriesPage` so the derived charts never
 * wait on these. Every field of each record is selected: the page shows all
 * of it, including values that look implausible.
 *
 * Skin temperature selects the full history (~one record per night). HRV is
 * 5-minute RMSSD windows (~55 a night), so it takes a `TimeRange`.
 */
const SKIN_TEMPERATURE_RECORDS_SOURCE = graphql(`
  query SkinTemperatureSourceRecords {
    viewer {
      config {
        homeTimeZone
      }
      sourceRecords {
        skinTemperature {
          id
          source
          startAt
          endAt
          baselineCelsius
          deltas {
            observedAt
            celsius
          }
          measurementLocation
        }
      }
    }
  }
`);

const HRV_READINGS_SOURCE = graphql(`
  query HrvSourceReadings($range: TimeRange) {
    viewer {
      config {
        homeTimeZone
      }
      sourceRecords {
        heartRateVariability(range: $range) {
          id
          source
          observedAt
          milliseconds
        }
      }
    }
  }
`);

export const SKIN_TEMPERATURE_RECORDS_QUERY =
  SkinTemperatureSourceRecordsDocument;
export const HRV_READINGS_QUERY = HrvSourceReadingsDocument;

// Referenced so the sources stay live for codegen and lint.
void SKIN_TEMPERATURE_RECORDS_SOURCE;
void HRV_READINGS_SOURCE;
