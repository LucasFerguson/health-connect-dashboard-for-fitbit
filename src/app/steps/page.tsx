import { MigrationNotice } from "~/components/migration/MigrationNotice";
import { HealthMetricPage } from "~/components/metric-detail/HealthMetricPage";

export const dynamic = "force-dynamic";

export default async function StepsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return (
    <>
      <MigrationNotice path="legacy-pipeline" />
      <HealthMetricPage kind="steps" selectedDate={date} />
    </>
  );
}
