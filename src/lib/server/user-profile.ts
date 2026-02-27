import type { SupabaseClient, User } from "@supabase/supabase-js";
import { defaultCurrencyForJurisdiction, isSupportedJurisdiction } from "@/lib/legal/jurisdictions";

export type AccessAccountState = "active" | "panic_hidden";

export type UserProfileRecord = {
  id: string;
  email: string;
  first_name: string | null;
  paid: boolean;
  onboarding_done: boolean;
  jurisdiction: string;
  currency_code: "GBP" | "USD" | "CAD";
  currency_overridden: boolean;
  has_relevant_agreements: boolean | null;
  account_state: AccessAccountState;
  recovery_key_required: boolean;
  recovery_key_generated_at: string | null;
  recovery_key_version: number;
};

function metadataFirstName(user: User) {
  if (typeof user.user_metadata?.first_name !== "string") {
    return null;
  }

  const normalized = user.user_metadata.first_name.trim();
  return normalized || null;
}

function metadataJurisdiction(user: User) {
  if (typeof user.user_metadata?.jurisdiction !== "string") {
    return null;
  }

  const normalized = user.user_metadata.jurisdiction.trim().toUpperCase();
  if (!normalized || !isSupportedJurisdiction(normalized)) {
    return null;
  }

  return normalized;
}

export async function ensureAndFetchUserProfile(supabase: SupabaseClient, user: User) {
  const selectColumns =
    "id,email,first_name,paid,onboarding_done,jurisdiction,currency_code,currency_overridden,has_relevant_agreements,account_state,recovery_key_required,recovery_key_generated_at,recovery_key_version";

  const { data: existingProfile } = await supabase
    .from("users")
    .select(selectColumns)
    .eq("id", user.id)
    .maybeSingle<UserProfileRecord>();

  if (existingProfile) {
    return existingProfile;
  }

  const initialFirstName = metadataFirstName(user);
  const initialJurisdiction = metadataJurisdiction(user) ?? "GB-EAW";
  const initialCurrency = defaultCurrencyForJurisdiction(initialJurisdiction);

  await supabase.from("users").insert({
    id: user.id,
    email: user.email ?? "",
    jurisdiction: initialJurisdiction,
    currency_code: initialCurrency,
    currency_overridden: false,
    ...(initialFirstName ? { first_name: initialFirstName } : {}),
  });

  const { data: profile } = await supabase
    .from("users")
    .select(selectColumns)
    .eq("id", user.id)
    .maybeSingle<UserProfileRecord>();

  return profile ?? null;
}
