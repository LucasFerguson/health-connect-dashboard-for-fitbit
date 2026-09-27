import { HealthspanPage } from "~/components/healthspan/HealthspanPage";
import { getHealthspanAnalytics } from "~/server/health/getHealthspanAnalytics";

export const dynamic = "force-dynamic";

export default async function HealthspanRoute() {
  return <HealthspanPage analytics={await getHealthspanAnalytics()} />;
}
