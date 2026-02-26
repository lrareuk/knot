import { redirect } from "next/navigation";
import { ONBOARDING_MODULES } from "@/lib/domain/defaults";
import { firstIncompleteModule } from "@/lib/domain/onboarding";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";
import { getAuthContext } from "@/lib/server/auth";

export default async function OnboardingRootPage() {
  const { user, profile, supabase } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/payment");
  }

  const position = await getOrCreateFinancialPosition(supabase, user.id);
  const nextModule = firstIncompleteModule(position, [...ONBOARDING_MODULES]);
  redirect(`/onboarding/${nextModule}`);
}
