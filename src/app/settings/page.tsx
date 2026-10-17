import { redirect } from "next/navigation";
import { AndroidAppCard } from "~/components/auth/AndroidAppCard";
import { PasswordForm } from "~/components/auth/PasswordForm";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import { backendAccount } from "~/server/auth/hcgateway";
import { getSessionToken } from "~/server/auth/session";
import { getLatestRelease } from "~/server/releases";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account · Health Dashboard" };

export default async function SettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const [account, published] = await Promise.all([
    backendAccount(token),
    getLatestRelease(),
  ]);

  return (
    <PageShell maxWidth="max-w-3xl" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-ink-0 text-2xl tracking-[.12em]">
            ACCOUNT
          </h1>
          <Label>
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
      <AndroidAppCard published={published} now={new Date()} />
    </PageShell>
  );
}
