import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AndroidAppCard } from "~/components/auth/AndroidAppCard";
import { ApiKeysPanel } from "~/components/auth/ApiKeysPanel";
import { PasswordForm } from "~/components/auth/PasswordForm";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import { curlExample } from "~/domain/apiKeys";
import { isHttpsRequest } from "~/domain/auth";
import { backendAccount, backendListApiKeys } from "~/server/auth/hcgateway";
import { getSessionToken } from "~/server/auth/session";
import { getLatestRelease } from "~/server/releases";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account · Health Dashboard" };

export default async function SettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const [account, published, keys, requestHeaders] = await Promise.all([
    backendAccount(token),
    getLatestRelease(),
    backendListApiKeys(token),
    headers(),
  ]);
  // The example uses the address this page was opened on, so it's right
  // both on the public domain and on the LAN.
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const origin = `${isHttpsRequest(requestHeaders) ? "https" : "http"}://${host}`;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date(new Date().toISOString().slice(0, 10));
  const example = curlExample(
    `${origin}/api/graphql`,
    new Date(today.getTime() - 7 * DAY_MS).toISOString().replace(".000", ""),
    today.toISOString().replace(".000", ""),
  );

  return (
    <PageShell maxWidth="max-w-3xl" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-ink-0 text-2xl tracking-[.12em]">
            ACCOUNT
          </h1>
          <Label className="max-sm:text-[11px]">
            SIGNED IN AS {account ? account.username.toUpperCase() : "?"}
          </Label>
        </div>
        <p className="text-ink-100 text-sm">
          This is your HCGateway account, which the phone app uses too.
        </p>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-ink-0 text-lg tracking-[.1em]">
          CHANGE PASSWORD
        </h2>
        <PasswordForm />
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-ink-0 text-lg tracking-[.1em]">
          API KEYS
        </h2>
        <p className="text-ink-100 text-sm">
          Read-only keys for pulling your own health data into scripts and other
          tools. A key can read the same data this dashboard shows you and
          nothing else: it can&apos;t change anything, sign in, or make more
          keys.
        </p>
        <ApiKeysPanel keys={keys} example={example} />
      </Card>
      <AndroidAppCard published={published} now={new Date()} />
    </PageShell>
  );
}
