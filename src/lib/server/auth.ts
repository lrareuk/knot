import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type AccessProfile = {
  id: string;
  email: string;
  paid: boolean;
  onboarding_done: boolean;
  jurisdiction: string;
};

export async function getAuthContext() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );

  const { data: profile } = await supabase
    .from("users")
    .select("id,email,paid,onboarding_done,jurisdiction")
    .eq("id", user.id)
    .single<AccessProfile>();

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

export async function requireDashboardAccess() {
  const context = await requireAuthContext();
  if (!context.profile.paid) {
    redirect("/payment");
  }
  if (!context.profile.onboarding_done) {
    redirect("/onboarding");
  }
  return context;
}
