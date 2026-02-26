import { redirect } from "next/navigation";
import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import SignupPaymentStep from "@/app/components/auth/SignupPaymentStep";
import { getAuthContext } from "@/lib/server/auth";
import { readSignupFirstNameCookie } from "@/lib/server/signup-state";

function resolveFirstName(input: {
  profileFirstName?: string | null;
  metadataFirstName?: unknown;
  cookieFirstName?: string | null;
}) {
  const fromProfile = input.profileFirstName?.trim();
  if (fromProfile) {
    return fromProfile;
  }

  if (typeof input.metadataFirstName === "string" && input.metadataFirstName.trim()) {
    return input.metadataFirstName.trim();
  }

  if (input.cookieFirstName) {
    return input.cookieFirstName;
  }

  return "there";
}

export default async function SignupPaymentPage() {
  const { user, profile } = await getAuthContext();

  if (!user || !profile) {
    redirect("/signup");
  }

  if (profile.paid && profile.onboarding_done) {
    redirect("/dashboard");
  }

  if (profile.paid) {
    redirect("/onboarding");
  }

  const cookieFirstName = await readSignupFirstNameCookie();
  const firstName = resolveFirstName({
    profileFirstName: profile.first_name,
    metadataFirstName: user.user_metadata?.first_name,
    cookieFirstName,
  });

  return (
    <AuthFlowShell>
      <SignupPaymentStep firstName={firstName} />
    </AuthFlowShell>
  );
}

