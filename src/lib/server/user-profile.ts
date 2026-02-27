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

type LegacyUserProfileRecord = {
  id: string;
  email: string;
  first_name: string | null;
  paid: boolean;
  onboarding_done: boolean;
  jurisdiction: string;
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

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = "code" in error ? String(error.code ?? "") : "";
  const maybeMessage = "message" in error ? String(error.message ?? "").toLowerCase() : "";
  return maybeCode === "42703" || maybeCode === "PGRST204" || (maybeMessage.includes("column") && maybeMessage.includes("does not exist"));
}

function normalizeProfile(profile: UserProfileRecord | LegacyUserProfileRecord): UserProfileRecord {
  const jurisdiction = typeof profile.jurisdiction === "string" && profile.jurisdiction.trim() ? profile.jurisdiction : "GB-SCT";
  const currencyFromProfile = "currency_code" in profile ? profile.currency_code : null;
  const currencyCode =
    currencyFromProfile === "GBP" || currencyFromProfile === "USD" || currencyFromProfile === "CAD"
      ? currencyFromProfile
      : defaultCurrencyForJurisdiction(jurisdiction);
  const currencyOverridden = "currency_overridden" in profile && typeof profile.currency_overridden === "boolean" ? profile.currency_overridden : false;
  const hasRelevantAgreements =
    "has_relevant_agreements" in profile && typeof profile.has_relevant_agreements === "boolean"
      ? profile.has_relevant_agreements
      : null;

  return {
    ...profile,
    jurisdiction,
    currency_code: currencyCode,
    currency_overridden: currencyOverridden,
    has_relevant_agreements: hasRelevantAgreements,
  };
}

export async function ensureAndFetchUserProfile(supabase: SupabaseClient, user: User) {
  const fullSelectColumns =
    "id,email,first_name,paid,onboarding_done,jurisdiction,currency_code,currency_overridden,has_relevant_agreements,account_state,recovery_key_required,recovery_key_generated_at,recovery_key_version";
  const legacySelectColumns =
    "id,email,first_name,paid,onboarding_done,jurisdiction,account_state,recovery_key_required,recovery_key_generated_at,recovery_key_version";

  const { data: existingProfile, error: fullProfileError } = await supabase
    .from("users")
    .select(fullSelectColumns)
    .eq("id", user.id)
    .maybeSingle<UserProfileRecord>();

  if (existingProfile) {
    return normalizeProfile(existingProfile);
  }

  if (isMissingColumnError(fullProfileError)) {
    const { data: legacyProfile } = await supabase
      .from("users")
      .select(legacySelectColumns)
      .eq("id", user.id)
      .maybeSingle<LegacyUserProfileRecord>();

    if (legacyProfile) {
      return normalizeProfile(legacyProfile);
    }
  }

  const initialFirstName = metadataFirstName(user);
  const initialJurisdiction = metadataJurisdiction(user) ?? "GB-SCT";
  const initialCurrency = defaultCurrencyForJurisdiction(initialJurisdiction);

  const legacyInsertPayload = {
    id: user.id,
    email: user.email ?? "",
    jurisdiction: initialJurisdiction,
    ...(initialFirstName ? { first_name: initialFirstName } : {}),
  };

  const { error: insertFullError } = await supabase.from("users").insert({
    ...legacyInsertPayload,
    currency_code: initialCurrency,
    currency_overridden: false,
  });

  if (insertFullError && isMissingColumnError(insertFullError)) {
    await supabase.from("users").insert(legacyInsertPayload);
  }

  const { data: profile, error: finalProfileError } = await supabase
    .from("users")
    .select(fullSelectColumns)
    .eq("id", user.id)
    .maybeSingle<UserProfileRecord>();

  if (profile) {
    return normalizeProfile(profile);
  }

  if (isMissingColumnError(finalProfileError)) {
    const { data: legacyProfile } = await supabase
      .from("users")
      .select(legacySelectColumns)
      .eq("id", user.id)
      .maybeSingle<LegacyUserProfileRecord>();

    if (legacyProfile) {
      return normalizeProfile(legacyProfile);
    }
  }

  return null;
}
