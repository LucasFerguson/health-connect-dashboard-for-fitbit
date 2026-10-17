import { AuthForm } from "~/components/auth/AuthForm";
import { safeNextPath } from "~/domain/auth";
import { signIn } from "~/server/auth/actions";

export const metadata = { title: "Sign in · Health Dashboard" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const { next, expired } = await searchParams;
  return (
    <AuthForm
      mode="login"
      action={signIn}
      next={safeNextPath(next)}
      notice={
        expired ? "You were signed out. Sign in again to continue." : undefined
      }
    />
  );
}
