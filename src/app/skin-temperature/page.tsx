import { Suspense } from "react";
import { HealthMetricPage } from "~/components/metric-detail/HealthMetricPage";
import { SkinTemperatureSourceRecords } from "~/components/source-records/SkinTemperatureSourceRecords";
import { SourceRecordsLoading } from "~/components/source-records/SourceRecordsSection";

export const dynamic = "force-dynamic";

export default async function SkinTemperaturePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <HealthMetricPage kind="skin-temperature" selectedDate={date}>
      {/* Streams in after the charts; its own query, so it can't slow them. */}
      <Suspense fallback={<SourceRecordsLoading />}>
        <SkinTemperatureSourceRecords />
      </Suspense>
    </HealthMetricPage>
  );
}
