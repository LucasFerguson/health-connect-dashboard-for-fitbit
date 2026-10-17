import { Suspense } from "react";
import { HealthMetricPage } from "~/components/metric-detail/HealthMetricPage";
import { HrvSourceReadings } from "~/components/source-records/HrvSourceReadings";
import { SourceRecordsLoading } from "~/components/source-records/SourceRecordsSection";
import { parseHrvRecordsWindow } from "~/domain/sourceRecords";

export const dynamic = "force-dynamic";

export default async function HrvPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; records?: string }>;
}) {
  const { date, records } = await searchParams;
  const window = parseHrvRecordsWindow(records);
  return (
    <HealthMetricPage kind="hrv" selectedDate={date}>
      {/* Streams in after the charts; its own query, so it can't slow them. */}
      <Suspense key={window} fallback={<SourceRecordsLoading />}>
        <HrvSourceReadings window={window} />
      </Suspense>
    </HealthMetricPage>
  );
}
