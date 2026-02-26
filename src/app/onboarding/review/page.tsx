import { redirect } from "next/navigation";
import OnboardingReview from "@/app/components/onboarding/OnboardingReview";
import { getAuthContext } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

export default async function OnboardingReviewPage() {
  const { user, profile, supabase } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/signup/payment");
  }

  const position = await getOrCreateFinancialPosition(supabase, user.id);

  return <OnboardingReview position={position} />;
}
