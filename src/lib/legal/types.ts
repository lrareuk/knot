import type { ScenarioConfig } from "@/lib/domain/types";
import type { ExtractedTerm } from "@/lib/legal/schemas";

export type LegalAgreement = {
  id: string;
  user_id: string;
  agreement_type: "prenup" | "postnup" | "separation";
  title: string | null;
  governing_jurisdiction: string | null;
  effective_date: string | null;
  user_summary: string | null;
  source_status: "manual_only" | "document_uploaded" | "terms_extracted" | "extraction_failed";
  created_at: string;
  updated_at: string;
};

export type LegalAgreementDocument = {
  id: string;
  agreement_id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  extraction_status: "pending" | "processing" | "completed" | "failed";
  extraction_error: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LegalAgreementTerm = {
  id: string;
  agreement_id: string;
  user_id: string;
  term_type: ExtractedTerm["term_type"];
  term_payload: Record<string, unknown>;
  impact_direction: ExtractedTerm["impact_direction"];
  confidence: number;
  citation: {
    quote: string;
    page?: number;
    section?: string;
    note?: string;
  };
  source_document_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AgreementInterpretationSeverity = "info" | "warning" | "high";

export type AgreementInterpretationWarning = {
  key: string;
  severity: AgreementInterpretationSeverity;
  message: string;
  affected_section:
    | "property"
    | "pension"
    | "savings"
    | "debts"
    | "maintenance"
    | "housing"
    | "income"
    | "general";
  term_id: string;
  term_type: LegalAgreementTerm["term_type"];
  citation: LegalAgreementTerm["citation"];
};

export type AgreementTermExtractionInput = {
  agreement: LegalAgreement;
  document: LegalAgreementDocument;
  textByPage: Array<{ page: number; text: string }>;
  jurisdiction: string;
};

export type TermExtractionProvider = {
  extractTerms: (input: AgreementTermExtractionInput) => Promise<ExtractedTerm[]>;
};

export type OcrProvider = {
  extractTextFromImage: (input: { mimeType: string; base64: string }) => Promise<string>;
};

export type ScenarioAgreementInterpretationInput = {
  jurisdictionCode: string;
  config: ScenarioConfig;
  terms: LegalAgreementTerm[];
};
