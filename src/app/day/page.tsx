import { redirect } from "next/navigation";
import { createPipelineContext } from "../../../pipeline/context";
import { dateKeyOf } from "~/domain/dayViewTime";

export const dynamic = "force-dynamic";

/** `/day` redirects to today's date so the date always lives in the URL,
 * per the design spec's requirement that a day be linkable and the back
 * button work. "Today" is computed in the configured home time zone
 * (`HEALTH_HOME_TIME_ZONE`), not the server's or the request's own zone —
 * otherwise a viewer west of UTC would be redirected to a date that's
 * already "tomorrow" there. */
export default function DayIndexPage() {
  const { homeTimeZone } = createPipelineContext();
  const today = dateKeyOf(new Date().toISOString(), homeTimeZone);
  redirect(`/day/${today}`);
}
