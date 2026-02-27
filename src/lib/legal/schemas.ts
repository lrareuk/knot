import { z } from "zod";

export const agreementTypeSchema = z.enum(["prenup", "postnup", "separation"]);

export const agreementSourceStatusSchema = z.enum([
  "manual_only",
  "document_uploaded",
  "terms_extracted",
  "extraction_failed",
]);

export const extractionStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

export const impactDirectionSchema = z.enum(["weakens_user", "benefits_user", "neutral", "unknown"]);

export const termTypeSchema = z.enum([
  "spousal_support_waiver",
  "spousal_support_cap",
  "separate_property_exclusion",
  "pension_exclusion",
  "debt_allocation_rule",
  "asset_split_ratio",
  "marital_home_allocation",
  "sunset_clause",
  "choice_of_law",
  "other_material_term",
]);

export const citationSchema = z.object({
  quote: z.string().min(1),
  page: z.number().int().positive().optional(),
  section: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const agreementInsertSchema = z.object({
  agreement_type: agreementTypeSchema,
  title: z.string().trim().max(160).nullable().optional(),
  governing_jurisdiction: z.string().trim().max(16).nullable().optional(),
  effective_date: z.string().date().nullable().optional(),
  user_summary: z.string().trim().max(2000).nullable().optional(),
});

export const agreementPatchSchema = agreementInsertSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export const extractedTermSchema = z.object({
  term_type: termTypeSchema,
  term_payload: z.record(z.string(), z.unknown()).default({}),
  impact_direction: impactDirectionSchema.default("unknown"),
  confidence: z.number().min(0).max(1),
  citation: citationSchema,
});

export const extractedTermsPayloadSchema = z.object({
  terms: z.array(extractedTermSchema),
});

export type AgreementInsertPayload = z.infer<typeof agreementInsertSchema>;
export type AgreementPatchPayload = z.infer<typeof agreementPatchSchema>;
export type ExtractedTerm = z.infer<typeof extractedTermSchema>;
