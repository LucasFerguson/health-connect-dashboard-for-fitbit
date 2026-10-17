import { AuthForm } from "~/components/auth/AuthForm";
import { signUp } from "~/server/auth/actions";

export const metadata = { title: "Create account · Health Dashboard" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
