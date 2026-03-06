export type MarketplaceProfessionalType = "solicitor" | "financial_adviser";

export type MarketplaceServiceMode = "remote" | "in_person" | "hybrid";

export type MarketplaceVerificationStatus = "pending" | "verified" | "suspended";

export type MarketplaceInquiryStatus = "pending" | "contacted" | "closed";

export type MarketplaceParticipantRole = "requester" | "advisor";

export type MarketplaceProfile = {
  id: string;
  user_id: string;
  professional_type: MarketplaceProfessionalType;
  display_name: string;
  firm_name: string | null;
  headline: string | null;
  bio: string | null;
  jurisdiction_codes: string[];
  specialisms: string[];
  service_modes: MarketplaceServiceMode[];
  languages: string[];
  years_experience: number | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  currency_code: "GBP" | "USD" | "CAD";
  contact_email: string | null;
  contact_url: string | null;
  verification_status: MarketplaceVerificationStatus;
  is_visible: boolean;
  is_accepting_new_clients: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketplaceInquiry = {
  id: string;
  requester_user_id: string;
  profile_id: string;
  message: string;
  context_snapshot: Record<string, unknown>;
  status: MarketplaceInquiryStatus;
  created_at: string;
  updated_at: string;
};

export type MarketplaceInquiryParticipant = {
  id: string;
  inquiry_id: string;
  user_id: string;
  role: MarketplaceParticipantRole;
  created_at: string;
  updated_at: string;
};

export type MarketplaceMessage = {
  id: string;
  inquiry_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type MarketplaceMessageAttachment = {
  id: string;
  inquiry_id: string;
  message_id: string;
  uploader_user_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
};

export type MarketplaceInquiryEvent = {
  id: string;
  inquiry_id: string;
  actor_user_id: string | null;
  event_type: "inquiry_created" | "status_changed" | "message_sent" | "attachment_added";
  event_payload: Record<string, unknown>;
  created_at: string;
};

export type MarketplaceThreadMessage = MarketplaceMessage & {
  attachments: MarketplaceMessageAttachment[];
};
