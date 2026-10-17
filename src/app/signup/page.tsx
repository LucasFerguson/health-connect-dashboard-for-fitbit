import { AndroidAppCard } from "~/components/auth/AndroidAppCard";
import { AuthForm } from "~/components/auth/AuthForm";
import { signUp } from "~/server/auth/actions";
import { getLatestRelease } from "~/server/releases";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account · Health Dashboard" };

export default async function SignupPage() {
  const published = await getLatestRelease();
  return (
    <AuthForm
      mode="signup"
      action={signUp}
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
