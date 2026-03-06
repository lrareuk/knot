import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MarketplaceInquiry,
  MarketplaceInquiryEvent,
  MarketplaceInquiryParticipant,
  MarketplaceInquiryStatus,
} from "@/lib/marketplace/types";

const MARKETPLACE_INQUIRY_SELECT =
  "id,requester_user_id,profile_id,message,context_snapshot,status,created_at,updated_at";

const MARKETPLACE_INQUIRY_PARTICIPANT_SELECT = "id,inquiry_id,user_id,role,created_at,updated_at";

const MARKETPLACE_INQUIRY_EVENT_SELECT = "id,inquiry_id,actor_user_id,event_type,event_payload,created_at";

export async function listRequesterInquiries(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("marketplace_inquiries")
    .select(MARKETPLACE_INQUIRY_SELECT)
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false });

  return {
    inquiries: (data ?? []) as MarketplaceInquiry[],
    error,
  };
}

export async function listAdvisorInquiries(supabase: SupabaseClient, advisorUserId: string) {
  const { data: profiles, error: profilesError } = await supabase
    .from("marketplace_profiles")
    .select("id")
    .eq("user_id", advisorUserId);

  if (profilesError) {
    return { inquiries: [] as MarketplaceInquiry[], error: profilesError };
  }

  const profileIds = (profiles ?? []).map((profile) => String(profile.id));
  if (profileIds.length === 0) {
    return { inquiries: [] as MarketplaceInquiry[], error: null };
  }

  const { data, error } = await supabase
    .from("marketplace_inquiries")
    .select(MARKETPLACE_INQUIRY_SELECT)
    .in("profile_id", profileIds)
    .order("created_at", { ascending: false });

  return {
    inquiries: (data ?? []) as MarketplaceInquiry[],
    error,
  };
}

export async function createInquiry(
  supabase: SupabaseClient,
  input: {
    requesterUserId: string;
    profileId: string;
    message: string;
    contextSnapshot: Record<string, unknown>;
    advisorUserId: string;
  }
) {
  const { data: inquiryData, error: inquiryError } = await supabase
    .from("marketplace_inquiries")
    .insert({
      requester_user_id: input.requesterUserId,
      profile_id: input.profileId,
      message: input.message,
      context_snapshot: input.contextSnapshot,
      status: "pending",
    })
    .select(MARKETPLACE_INQUIRY_SELECT)
    .single<MarketplaceInquiry>();

  if (inquiryError || !inquiryData) {
    return {
      inquiry: null,
      error: inquiryError,
    };
  }

  const participantRows = [
    {
      inquiry_id: inquiryData.id,
      user_id: input.requesterUserId,
      role: "requester",
    },
    {
      inquiry_id: inquiryData.id,
      user_id: input.advisorUserId,
      role: "advisor",
    },
  ];

  const { error: participantsError } = await supabase.from("marketplace_inquiry_participants").insert(participantRows);

  if (participantsError) {
    await supabase.from("marketplace_inquiries").delete().eq("id", inquiryData.id);
    return {
      inquiry: null,
      error: participantsError,
    };
  }

  await supabase.from("marketplace_inquiry_events").insert({
    inquiry_id: inquiryData.id,
    actor_user_id: input.requesterUserId,
    event_type: "inquiry_created",
    event_payload: {
      status: "pending",
    },
  });

  return {
    inquiry: inquiryData,
    error: null,
  };
}

export async function getInquiryById(supabase: SupabaseClient, inquiryId: string) {
  const { data, error } = await supabase
    .from("marketplace_inquiries")
    .select(MARKETPLACE_INQUIRY_SELECT)
    .eq("id", inquiryId)
    .maybeSingle<MarketplaceInquiry>();

  return {
    inquiry: data ?? null,
    error,
  };
}

export async function getInquiryParticipant(supabase: SupabaseClient, inquiryId: string, userId: string) {
  const { data, error } = await supabase
    .from("marketplace_inquiry_participants")
    .select(MARKETPLACE_INQUIRY_PARTICIPANT_SELECT)
    .eq("inquiry_id", inquiryId)
    .eq("user_id", userId)
    .maybeSingle<MarketplaceInquiryParticipant>();

  return {
    participant: data ?? null,
    error,
  };
}

export async function patchInquiryStatus(
  supabase: SupabaseClient,
  inquiryId: string,
  status: MarketplaceInquiryStatus,
  actorUserId: string
) {
  const { data, error } = await supabase
    .from("marketplace_inquiries")
    .update({ status })
    .eq("id", inquiryId)
    .select(MARKETPLACE_INQUIRY_SELECT)
    .single<MarketplaceInquiry>();

  if (error || !data) {
    return {
      inquiry: null,
      error,
    };
  }

  await supabase.from("marketplace_inquiry_events").insert({
    inquiry_id: inquiryId,
    actor_user_id: actorUserId,
    event_type: "status_changed",
    event_payload: { status },
  });

  return {
    inquiry: data,
    error: null,
  };
}

export async function listInquiryEvents(supabase: SupabaseClient, inquiryId: string) {
  const { data, error } = await supabase
    .from("marketplace_inquiry_events")
    .select(MARKETPLACE_INQUIRY_EVENT_SELECT)
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  return {
    events: (data ?? []) as MarketplaceInquiryEvent[],
    error,
  };
}
