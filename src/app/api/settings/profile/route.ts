import { NextResponse } from "next/server";
import { z } from "zod";
import { defaultCurrencyForJurisdiction, isSupportedJurisdiction } from "@/lib/legal/jurisdictions";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";

const payloadSchema = z.object({
  first_name: z.string().max(60),
  jurisdiction: z.string().optional(),
  currency_code: z.enum(["GBP", "USD", "CAD"]).optional(),
  currency_overridden: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return badRequest("Invalid payload");
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return badRequest("Invalid profile payload");
  }

  const firstName = parsed.data.first_name.trim() || null;
  const jurisdiction = parsed.data.jurisdiction?.trim().toUpperCase();
  const hasJurisdiction = typeof jurisdiction === "string" && jurisdiction.length > 0;

  if (hasJurisdiction && !isSupportedJurisdiction(jurisdiction)) {
    return badRequest("Invalid jurisdiction");
  }

  const nextJurisdiction = hasJurisdiction ? jurisdiction : context.profile.jurisdiction;
  const nextCurrencyOverridden = parsed.data.currency_overridden ?? context.profile.currency_overridden;
  const nextCurrencyCode =
    parsed.data.currency_code ??
    (nextCurrencyOverridden ? context.profile.currency_code : defaultCurrencyForJurisdiction(nextJurisdiction));

  const { data, error } = await context.supabase
    .from("users")
    .update({
      first_name: firstName,
      jurisdiction: nextJurisdiction,
      currency_overridden: nextCurrencyOverridden,
      currency_code: nextCurrencyOverridden ? nextCurrencyCode : defaultCurrencyForJurisdiction(nextJurisdiction),
    })
    .eq("id", context.user.id)
    .select("id,email,first_name,jurisdiction,currency_code,currency_overridden,has_relevant_agreements")
    .single();

  if (error || !data) {
    return serverError("Unable to update profile");
  }

  return NextResponse.json({ profile: data });
}
