import { AndroidAppCard } from "~/components/auth/AndroidAppCard";
import { AuthForm } from "~/components/auth/AuthForm";
import { safeNextPath } from "~/domain/auth";
import { signIn } from "~/server/auth/actions";
import { getLatestRelease } from "~/server/releases";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · Health Dashboard" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const [{ next, expired }, published] = await Promise.all([
    searchParams,
    getLatestRelease(),
  ]);
  return (
    <AuthForm
      mode="login"
      action={signIn}
      next={safeNextPath(next)}
      notice={
        expired ? "You were signed out. Sign in again to continue." : undefined
      }
      footer={
        <AndroidAppCard
          published={published}
          now={new Date()}
          className="w-full max-w-sm"
        />
      }
    />
  );
}
