import { HealthMetricPage } from "~/components/metric-detail/HealthMetricPage";

export const dynamic = "force-dynamic";

export default async function CaloriesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  return <HealthMetricPage kind="calories" selectedDate={date} />;
}
