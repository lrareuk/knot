import { redirect } from "next/navigation";
import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import SignupEmailStep from "@/app/components/auth/SignupEmailStep";
import { readSignupStateCookie } from "@/lib/server/signup-state";

export default async function SignupEmailPage() {
  const signupState = await readSignupStateCookie();
  const firstName = signupState?.firstName ?? null;
  const jurisdiction = signupState?.jurisdiction ?? null;

  if (!firstName || !jurisdiction) {
    redirect("/signup");
  }

  return (
    <AuthFlowShell>
      <SignupEmailStep firstName={firstName} jurisdiction={jurisdiction} />
    </AuthFlowShell>
  );
}
