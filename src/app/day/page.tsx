import { BackendErrorPanel } from "~/components/BackendErrorPanel";
import { redirect } from "next/navigation";
import { dateKeyOf } from "~/domain/dayViewTime";
import { getHomeTimeZone } from "~/server/health/getDayView";
import { settle } from "~/server/health/backendDiagnostics";

/** `/day` redirects to today's date so the date always lives in the URL,
 * per the design spec's requirement that a day be linkable and the back
 * button work.
 *
 * "Today" is NOT the server's `new Date()` read in UTC or the host's zone —
 * that's the UTC-midnight bug this app already fixed once (see
 * `dayViewTime.ts`'s comments on anchoring to the configured home time
 * zone). `day(date:)` has no "default to today" form, so the page asks the
 * backend for the account's home time zone and computes today in that zone
 * with the shared `dateKeyOf` helper, the same way the backend decides
 * which days are `future`.
 */
export const dynamic = "force-dynamic";

export default async function DayIndexPage() {
  const timeZone = await settle(getHomeTimeZone());
  if (!timeZone.ok) {
    return <BackendErrorPanel diagnostics={timeZone.diagnostics} />;
  }
  redirect(`/day/${dateKeyOf(new Date().toISOString(), timeZone.data)}`);
}
