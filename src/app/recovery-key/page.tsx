import { redirect } from "next/navigation";
import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import RecoveryKeySetupStep from "@/app/components/auth/RecoveryKeySetupStep";
import { requireAuthContext } from "@/lib/server/auth";

export default async function RecoveryKeyPage() {
  const { profile } = await requireAuthContext();

  if (profile.account_state !== "active") {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/signup/payment");
  }

  if (!profile.onboarding_done) {
    redirect("/onboarding");
  }

  if (!profile.recovery_key_required) {
    redirect("/dashboard");
  }

  return (
    <AuthFlowShell>
      <RecoveryKeySetupStep firstName={profile.first_name ?? "there"} />
    </AuthFlowShell>
  );
}
