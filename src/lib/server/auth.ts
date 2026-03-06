import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ensureAndFetchUserProfile } from "@/lib/server/user-profile";

export type AccessProfile = NonNullable<Awaited<ReturnType<typeof ensureAndFetchUserProfile>>>;

export async function getAuthContext() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await ensureAndFetchUserProfile(supabase, user);

  return { supabase, user, profile: profile ?? null };
}

export async function requireAuthContext() {
  const context = await getAuthContext();
  if (!context.user || !context.profile) {
    redirect("/login");
  }
  return {
    ...context,
    user: context.user!,
    profile: context.profile!,
  };
}

export async function requireActiveAuthContext() {
  const context = await requireAuthContext();
  if (context.profile.account_state !== "active") {
    redirect("/login");
  }
  if (context.profile.recovery_key_required) {
    redirect("/recovery-key");
  }
  return context;
}

export async function requirePaidActiveAuthContext() {
  const context = await requireActiveAuthContext();
  if (!context.profile.paid) {
    redirect("/signup/payment");
  }
  return context;
}

export async function requireDashboardAccess() {
  const context = await requirePaidActiveAuthContext();
  if (!context.profile.onboarding_done) {
    redirect("/onboarding");
  }
  return context;
}
