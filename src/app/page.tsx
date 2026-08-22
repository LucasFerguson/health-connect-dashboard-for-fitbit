import { Dashboard } from "~/components/Dashboard";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getHealthSnapshot();
  return <Dashboard snapshot={snapshot} />;
}
