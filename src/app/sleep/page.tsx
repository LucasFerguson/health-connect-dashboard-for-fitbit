import { SleepQuantityView } from "~/components/sleep-quantity/SleepQuantityView";
import { isDateKey } from "~/domain/health";
import { getDailySleep } from "~/server/health/getDailySleep";

export const dynamic = "force-dynamic";

export default async function SleepQuantityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, data] = await Promise.all([searchParams, getDailySleep()]);

  return (
    <SleepQuantityView
      daily={data.daily}
      targetMinutes={data.targetMinutes}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
