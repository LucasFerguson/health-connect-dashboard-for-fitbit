import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { SleepQuantityView } from "~/components/sleep-quantity/SleepQuantityView";
import { isDateKey } from "~/domain/health";
import { getDailySleep } from "~/server/health/getDailySleep";
import { settle } from "~/server/health/backendDiagnostics";

export const dynamic = "force-dynamic";

export default async function SleepQuantityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, result] = await Promise.all([
    searchParams,
    settle(getDailySleep()),
  ]);
  if (!result.ok) return <BackendErrorPanel diagnostics={result.diagnostics} />;

  return (
    <SleepQuantityView
      daily={result.data.daily}
      targetMinutes={result.data.targetMinutes}
      selectedDate={isDateKey(date) ? date : undefined}
    />
  );
}
