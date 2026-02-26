import { redirect } from "next/navigation";
import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import SignupEmailStep from "@/app/components/auth/SignupEmailStep";
import { readSignupFirstNameCookie } from "@/lib/server/signup-state";

export default async function SignupEmailPage() {
  const firstName = await readSignupFirstNameCookie();

  if (!firstName) {
    redirect("/signup");
  }

  return (
    <AuthFlowShell>
      <SignupEmailStep firstName={firstName} />
    </AuthFlowShell>
  );
}

