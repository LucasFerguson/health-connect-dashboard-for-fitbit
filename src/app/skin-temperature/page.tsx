import { HealthMetricPage } from "~/components/metric-detail/HealthMetricPage";

export const dynamic = "force-dynamic";

export default async function SkinTemperaturePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return <HealthMetricPage kind="skin-temperature" selectedDate={date} />;
}
