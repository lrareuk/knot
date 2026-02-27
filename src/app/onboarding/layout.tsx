import { redirect } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { getAuthContext } from "@/lib/server/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAuthContext();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.account_state !== "active") {
    redirect("/login");
  }

  if (!profile.paid) {
    redirect("/signup/payment");
  }

  return (
    <OnboardingShell userId={user.id} firstName={profile.first_name ?? null}>
      {children}
    </OnboardingShell>
  );
}
