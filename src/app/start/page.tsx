import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server/auth";
import { resolveStartRedirect } from "@/lib/server/start-route";

export default async function StartPage() {
  const { user, profile } = await getAuthContext();

  const destination = resolveStartRedirect({
    isAuthenticated: Boolean(user),
    paid: profile?.paid ?? false,
    onboardingDone: profile?.onboarding_done ?? false,
    accountState: profile?.account_state ?? "active",
    recoveryKeyRequired: profile?.recovery_key_required ?? false,
  });

  redirect(destination);
}
