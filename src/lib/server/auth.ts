import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type AccessProfile = {
  id: string;
  email: string;
  first_name: string | null;
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

  const metadataFirstName =
    typeof user.user_metadata?.first_name === "string" && user.user_metadata.first_name.trim()
      ? user.user_metadata.first_name.trim()
      : null;

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      ...(metadataFirstName ? { first_name: metadataFirstName } : {}),
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );

  const { data: profile } = await supabase
    .from("users")
    .select("id,email,first_name,paid,onboarding_done,jurisdiction")
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
    redirect("/signup/payment");
  }
  if (!context.profile.onboarding_done) {
    redirect("/onboarding");
  }
  return context;
}
