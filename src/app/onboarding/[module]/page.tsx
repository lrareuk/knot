import { notFound, redirect } from "next/navigation";
import { ONBOARDING_MODULES, type OnboardingModule } from "@/lib/domain/defaults";
import OnboardingModuleEditor from "@/app/components/onboarding/OnboardingModuleEditor";
import { getAuthContext } from "@/lib/server/auth";
import { getOrCreateFinancialPosition } from "@/lib/server/financial-position";

export default async function OnboardingModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;

  if (!ONBOARDING_MODULES.includes(module as OnboardingModule)) {
    notFound();
  }

  const { user, profile, supabase } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/signup/payment");
  }

  const position = await getOrCreateFinancialPosition(supabase, user.id);

  return <OnboardingModuleEditor module={module as OnboardingModule} initialPosition={position} />;
}
