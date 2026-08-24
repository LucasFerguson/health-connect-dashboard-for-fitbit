import { redirect } from "next/navigation";
import { dateKeyOf } from "~/domain/dayViewTime";
import { getDayAnalytics } from "~/server/health/getDayAnalytics";

/** `/day` redirects to today's date so the date always lives in the URL,
 * per the design spec's requirement that a day be linkable and the back
 * button work.
 *
 * "Today" here is NOT computed locally from `new Date()` against a guessed
 * time zone — that's exactly the UTC-midnight bug this app already fixed
 * once (see `dayViewTime.ts`'s comments on anchoring to the configured
 * home time zone rather than UTC midnight). The `analytics/day` endpoint
 * only defaults `date` server-side when the query param is entirely
 * *absent* (see `HCGateway/api/apiVersions/v2/routes.py`); the
 * `getDayAnalytics()`/`HealthConnectClient` entrypoint from step 1 always
 * sends an explicit `date`, so passing a UTC-guessed date would make the
 * server honor that exact (possibly wrong) date rather than applying its
 * own home-zone default — silently reintroducing the bug.
 *
 * Instead: make one cheap `radius: 0` probe request with a UTC-today
 * guess purely to learn the account's authoritative `day.timeZone` (never
 * to read its `date`, which just echoes back whatever we asked for), then
 * compute "today" properly in that zone with the existing shared
 * `dateKeyOf` helper and redirect there. If the guess already happened to
 * land on the correct home-zone date, this is a same-date redirect to a
 * page whose own server component (`getDayAnalytics()`) will hit the
 * warm in-memory cache from the probe.
 */
export const dynamic = "force-dynamic";

function utcTodayGuess(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DayIndexPage() {
  const probe = await getDayAnalytics(utcTodayGuess(), 0);
  const today = dateKeyOf(new Date().toISOString(), probe.day.timeZone);
  redirect(`/day/${today}`);
}
