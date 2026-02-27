import { NextResponse } from "next/server";
import { agreementInsertSchema } from "@/lib/legal/schemas";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { listAgreementsBundle, normalizeNullableText } from "@/lib/server/legal-agreements";

export async function GET() {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const bundle = await listAgreementsBundle(context.supabase, context.user.id);
  if (bundle.error) {
    return serverError("Unable to fetch agreements");
  }

  return NextResponse.json({
    has_relevant_agreements: context.profile?.has_relevant_agreements ?? null,
    agreements: bundle.agreements,
    documents: bundle.documents,
    terms: bundle.terms,
  });
}

export async function POST(req: Request) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = agreementInsertSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid agreement payload");
  }

  const { data, error } = await context.supabase
    .from("legal_agreements")
    .insert({
      user_id: context.user.id,
      agreement_type: parsed.data.agreement_type,
      title: normalizeNullableText(parsed.data.title),
      governing_jurisdiction: normalizeNullableText(parsed.data.governing_jurisdiction),
      effective_date: parsed.data.effective_date ?? null,
      user_summary: normalizeNullableText(parsed.data.user_summary),
      source_status: "manual_only",
    })
    .select("id,user_id,agreement_type,title,governing_jurisdiction,effective_date,user_summary,source_status,created_at,updated_at")
    .single();

  if (error || !data) {
    return serverError("Unable to create agreement");
  }

  return NextResponse.json({ agreement: data }, { status: 201 });
}
