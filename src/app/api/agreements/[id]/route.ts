import { NextResponse } from "next/server";
import { agreementPatchSchema } from "@/lib/legal/schemas";
import { badRequest, requireApiUser, serverError } from "@/lib/server/api";
import { getAgreementForUser, normalizeNullableText } from "@/lib/server/legal-agreements";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const { agreement, error } = await getAgreementForUser(context.supabase, context.user.id, id);

  if (error || !agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  return NextResponse.json({ agreement });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await requireApiUser();
  if (context.response || !context.user) {
    return context.response;
  }

  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as unknown;
  const parsed = agreementPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid agreement update payload");
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.agreement_type) {
    updates.agreement_type = parsed.data.agreement_type;
  }
  if (Object.hasOwn(parsed.data, "title")) {
    updates.title = normalizeNullableText(parsed.data.title);
  }
  if (Object.hasOwn(parsed.data, "governing_jurisdiction")) {
    updates.governing_jurisdiction = normalizeNullableText(parsed.data.governing_jurisdiction?.toUpperCase());
  }
  if (Object.hasOwn(parsed.data, "effective_date")) {
    updates.effective_date = parsed.data.effective_date ?? null;
  }
  if (Object.hasOwn(parsed.data, "user_summary")) {
    updates.user_summary = normalizeNullableText(parsed.data.user_summary);
  }

  const { data, error } = await context.supabase
    .from("legal_agreements")
    .update(updates)
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id,user_id,agreement_type,title,governing_jurisdiction,effective_date,user_summary,source_status,created_at,updated_at")
    .single();

  if (error || !data) {
    return serverError("Unable to update agreement");
  }

  return NextResponse.json({ agreement: data });
}
