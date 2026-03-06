import { z } from "zod";

export const marketplaceProfessionalTypeSchema = z.enum(["solicitor", "financial_adviser"]);
export const marketplaceServiceModeSchema = z.enum(["remote", "in_person", "hybrid"]);
export const marketplaceVerificationStatusSchema = z.enum(["pending", "verified", "suspended"]);
export const marketplaceInquiryStatusSchema = z.enum(["pending", "contacted", "closed"]);
export const marketplaceParticipantRoleSchema = z.enum(["requester", "advisor"]);

const normalizedStringArray = z
  .array(z.string().trim().min(1).max(64))
  .default([])
  .transform((values) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))));

export const marketplaceProfileCreateSchema = z.object({
  professional_type: marketplaceProfessionalTypeSchema,
  display_name: z.string().trim().min(2).max(120),
  firm_name: z.string().trim().max(160).nullable().optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(4000).nullable().optional(),
  jurisdiction_codes: normalizedStringArray,
  specialisms: normalizedStringArray,
  service_modes: z.array(marketplaceServiceModeSchema).min(1).max(3),
  languages: z.array(z.string().trim().min(2).max(16)).min(1).max(8),
  years_experience: z.number().int().min(0).max(70).nullable().optional(),
  hourly_rate_min: z.number().int().min(0).nullable().optional(),
  hourly_rate_max: z.number().int().min(0).nullable().optional(),
  currency_code: z.enum(["GBP", "USD", "CAD"]).default("GBP"),
  contact_email: z.string().trim().email().max(320).nullable().optional(),
  contact_url: z.string().trim().url().max(2048).nullable().optional(),
  is_accepting_new_clients: z.boolean().default(true),
});

export const marketplaceProfilePatchSchema = marketplaceProfileCreateSchema
  .omit({ professional_type: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const marketplaceProfileAdminPatchSchema = z
  .object({
    verification_status: marketplaceVerificationStatusSchema.optional(),
    is_visible: z.boolean().optional(),
    is_accepting_new_clients: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const marketplaceProfilesFilterSchema = z.object({
  type: marketplaceProfessionalTypeSchema.optional(),
  jurisdiction: z.string().trim().min(1).max(16).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  accepting: z.boolean().optional(),
});

export const marketplaceInquiryCreateSchema = z.object({
  profile_id: z.string().uuid(),
  message: z.string().trim().min(20).max(2000),
  selected_scenario_ids: z.array(z.string().uuid()).min(1).max(5),
  finished_modelling_confirmed: z.literal(true),
  offsetting_risk_acknowledged: z.boolean(),
});

export const marketplaceInquiryStatusPatchSchema = z.object({
  status: marketplaceInquiryStatusSchema,
});

export const marketplaceMessageCreateSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const marketplaceAttachmentCreateSchema = z.object({
  message_id: z.string().uuid(),
});

export type MarketplaceProfileCreatePayload = z.infer<typeof marketplaceProfileCreateSchema>;
export type MarketplaceProfilePatchPayload = z.infer<typeof marketplaceProfilePatchSchema>;
export type MarketplaceProfileAdminPatchPayload = z.infer<typeof marketplaceProfileAdminPatchSchema>;
export type MarketplaceInquiryCreatePayload = z.infer<typeof marketplaceInquiryCreateSchema>;
export type MarketplaceInquiryStatusPatchPayload = z.infer<typeof marketplaceInquiryStatusPatchSchema>;
export type MarketplaceMessageCreatePayload = z.infer<typeof marketplaceMessageCreateSchema>;
