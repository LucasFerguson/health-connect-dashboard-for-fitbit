import { MigrationNotice } from "~/components/migration/MigrationNotice";
import { HealthspanPage } from "~/components/healthspan/HealthspanPage";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function HealthspanRoute() {
  const snapshot = await getHealthSnapshot();
  return (
    <>
      <MigrationNotice path="legacy-pipeline" />
      <HealthspanPage analytics={snapshot.analytics.healthspan} />
    </>
  );
}
