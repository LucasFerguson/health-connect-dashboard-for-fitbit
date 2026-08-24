import { notFound } from "next/navigation";
import { createPipelineContext } from "../../../../pipeline/context";
import { DayView } from "~/components/day-view/DayView";
import { getDayViewSnapshot } from "~/server/health/getDayViewSnapshot";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function DayViewPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_PATTERN.test(date)) {
    notFound();
  }

  const { snapshot, steps, sleepSessions } = await getDayViewSnapshot();
  const { homeTimeZone } = createPipelineContext();

  return (
    <DayView
      date={date}
      analytics={snapshot.analytics}
      sleepSessions={sleepSessions}
      steps={steps}
      timeZone={homeTimeZone}
    />
  );
}
