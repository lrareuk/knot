import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegalAgreement, LegalAgreementDocument, LegalAgreementTerm } from "@/lib/legal/types";

export const AGREEMENT_MAX_DOCUMENTS = 5;
export const AGREEMENT_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const AGREEMENT_ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic"]);

export async function listAgreementsBundle(supabase: SupabaseClient, userId: string) {
  const [agreementsRes, documentsRes, termsRes] = await Promise.all([
    supabase
      .from("legal_agreements")
      .select("id,user_id,agreement_type,title,governing_jurisdiction,effective_date,user_summary,source_status,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("legal_agreement_documents")
      .select(
        "id,agreement_id,user_id,file_name,mime_type,size_bytes,storage_path,extraction_status,extraction_error,processed_at,created_at,updated_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("legal_agreement_terms")
      .select("id,agreement_id,user_id,term_type,term_payload,impact_direction,confidence,citation,source_document_id,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    agreements: (agreementsRes.data ?? []) as LegalAgreement[],
    documents: (documentsRes.data ?? []) as LegalAgreementDocument[],
    terms: (termsRes.data ?? []) as LegalAgreementTerm[],
    error: agreementsRes.error ?? documentsRes.error ?? termsRes.error,
  };
}

export async function getAgreementForUser(supabase: SupabaseClient, userId: string, agreementId: string) {
  const { data, error } = await supabase
    .from("legal_agreements")
    .select("id,user_id,agreement_type,title,governing_jurisdiction,effective_date,user_summary,source_status,created_at,updated_at")
    .eq("id", agreementId)
    .eq("user_id", userId)
    .maybeSingle<LegalAgreement>();

  return { agreement: data ?? null, error };
}

export async function getDocumentForUser(supabase: SupabaseClient, userId: string, documentId: string) {
  const { data, error } = await supabase
    .from("legal_agreement_documents")
    .select(
      "id,agreement_id,user_id,file_name,mime_type,size_bytes,storage_path,extraction_status,extraction_error,processed_at,created_at,updated_at"
    )
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle<LegalAgreementDocument>();

  return { document: data ?? null, error };
}

export async function documentCountForAgreement(supabase: SupabaseClient, userId: string, agreementId: string) {
  const { count, error } = await supabase
    .from("legal_agreement_documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("agreement_id", agreementId);

  return { count: count ?? 0, error };
}

export function normalizeNullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}
