import { redirect } from "next/navigation";
import { firstIncompleteModuleRoute } from "@/lib/onboarding/progress";
import { normalizeFinancialPosition } from "@/lib/onboarding/normalize";
import { getAuthContext } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

export default async function OnboardingRootPage() {
  const { user, profile, supabase } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.account_state !== "active") {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/signup/payment");
  }

  if (!profile.financial_abuse_acknowledged_at) {
    redirect("/onboarding/safety");
  }

  const rawPosition = await getOrCreateFinancialPosition(supabase, user.id);
  const position = normalizeFinancialPosition(rawPosition, user.id);
  redirect(firstIncompleteModuleRoute(position));
}
