import { MigrationNotice } from "~/components/migration/MigrationNotice";
import { SleepQuantityView } from "~/components/sleep-quantity/SleepQuantityView";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function SleepQuantityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, snapshot] = await Promise.all([
    searchParams,
    getHealthSnapshot(),
  ]);
  return (
    <>
      <MigrationNotice path="legacy-pipeline" />
      <SleepQuantityView
        daily={snapshot.analytics.dailySleep}
        targetMinutes={snapshot.analytics.sleepDebt.targetMinutes}
        selectedDate={validDate(date) ? date : undefined}
      />
    </>
  );
}

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
