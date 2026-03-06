import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketplaceProfile, MarketplaceProfessionalType } from "@/lib/marketplace/types";

const MARKETPLACE_PROFILE_SELECT =
  "id,user_id,professional_type,display_name,firm_name,headline,bio,jurisdiction_codes,specialisms,service_modes,languages,years_experience,hourly_rate_min,hourly_rate_max,currency_code,contact_email,contact_url,verification_status,is_visible,is_accepting_new_clients,created_at,updated_at";

export type MarketplaceProfileFilters = {
  type?: MarketplaceProfessionalType;
  jurisdiction?: string;
  q?: string;
  accepting?: boolean;
};

export async function listVisibleMarketplaceProfiles(
  supabase: SupabaseClient,
  filters: MarketplaceProfileFilters = {}
): Promise<{ profiles: MarketplaceProfile[]; error: unknown }> {
  let query = supabase
    .from("marketplace_profiles")
    .select(MARKETPLACE_PROFILE_SELECT)
    .eq("is_visible", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (filters.type) {
    query = query.eq("professional_type", filters.type);
  }

  if (typeof filters.accepting === "boolean") {
    query = query.eq("is_accepting_new_clients", filters.accepting);
  }

  if (filters.jurisdiction) {
    query = query.contains("jurisdiction_codes", [filters.jurisdiction]);
  }

  if (filters.q) {
    query = query.ilike("search_text", `%${filters.q.toLowerCase()}%`);
  }

  const { data, error } = await query;

  return {
    profiles: (data ?? []) as MarketplaceProfile[],
    error,
  };
}

export async function getVisibleMarketplaceProfileById(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .select(MARKETPLACE_PROFILE_SELECT)
    .eq("id", profileId)
    .eq("is_visible", true)
    .eq("verification_status", "verified")
    .maybeSingle<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}

export async function getOwnMarketplaceProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .select(MARKETPLACE_PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}

export async function getMarketplaceProfileById(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .select(MARKETPLACE_PROFILE_SELECT)
    .eq("id", profileId)
    .maybeSingle<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}

export async function createOwnMarketplaceProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<{ profile: MarketplaceProfile | null; error: unknown }> {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select(MARKETPLACE_PROFILE_SELECT)
    .single<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}

export async function patchOwnMarketplaceProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<{ profile: MarketplaceProfile | null; error: unknown }> {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .update(payload)
    .eq("user_id", userId)
    .select(MARKETPLACE_PROFILE_SELECT)
    .single<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}

export async function adminListMarketplaceProfiles(supabase: SupabaseClient, verificationStatus?: string) {
  let query = supabase.from("marketplace_profiles").select(MARKETPLACE_PROFILE_SELECT).order("created_at", { ascending: false });

  if (verificationStatus) {
    query = query.eq("verification_status", verificationStatus);
  }

  const { data, error } = await query;
  return {
    profiles: (data ?? []) as MarketplaceProfile[],
    error,
  };
}

export async function adminPatchMarketplaceProfile(
  supabase: SupabaseClient,
  profileId: string,
  payload: Record<string, unknown>
): Promise<{ profile: MarketplaceProfile | null; error: unknown }> {
  const { data, error } = await supabase
    .from("marketplace_profiles")
    .update(payload)
    .eq("id", profileId)
    .select(MARKETPLACE_PROFILE_SELECT)
    .single<MarketplaceProfile>();

  return {
    profile: data ?? null,
    error,
  };
}
